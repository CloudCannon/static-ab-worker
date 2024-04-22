const EXPERIMENT_DEFINE = "data-ab-define";
const EXPERIMENT_RATIO = "data-ab-ratio";
const EXPERIMENT_REFERENCE = "data-ab-reference";
const EXPERIMENT_VARIATION = "data-ab-variation";

export default async function (request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
	const fingerprint = [
		request.headers.get('cf-connecting-ip'),
		request.headers.get('User-Agent')
	];

	const res = await fetch(request);
	const contentType = res.headers.get("Content-Type");

	if (!contentType?.includes("text/html")) {
		return res;
	}

	const experiments: Record<string, number> = {};

	const rewriter = new HTMLRewriter().on(`[${EXPERIMENT_DEFINE}]`, {
		async element(element: Element) {
			const experiment = element.getAttribute(EXPERIMENT_DEFINE) || "unknown";
			const ratioString = element.getAttribute(EXPERIMENT_RATIO);
			const ratios = parseRatios(ratioString || "1");
			let variation = await getSemiStableAssignedVariation(fingerprint, experiment, ratios);

			experiments[experiment] = variation;

			element.removeAttribute(EXPERIMENT_DEFINE);
			element.removeAttribute(EXPERIMENT_RATIO);
		},
	}).on(`[${EXPERIMENT_REFERENCE}]`, {
		element(element: Element) {
			const experiment = element.getAttribute(EXPERIMENT_REFERENCE) ?? "unknown";
			const variantString = element.getAttribute(EXPERIMENT_VARIATION) || "0";

			if (parseInt(variantString, 10) == experiments[experiment]) {
				if (element.tagName == "template") {
					element.removeAndKeepContent();
				} else {
					element.removeAttribute(EXPERIMENT_REFERENCE);
					element.removeAttribute(EXPERIMENT_VARIATION);
				}
			} else {
				element.remove();
			}
		}
	});

	return rewriter.transform(res);
};

const parseRatios = (ratioString: string): number[] => {
	if (!/^\d+(:\d+)*$/.test(ratioString)) {
		return [1];
	}

	return ratioString.split(':').map(p => parseInt(p, 10));
}

const sum = (arr: number[]) => {
	return arr.reduce((a, b) => a + b, 0);
}

const getSemiStableAssignedVariation = async (fingerprint: unknown, experimentName: string, ratios: number[]): Promise<number> => {
	const MAX_UINT8 = 255;
	const ratioMultiplier = MAX_UINT8 / sum(ratios);

	const fingerprintHash: Uint8Array = await hash('SHA-1', JSON.stringify({fingerprint, experimentName}));
	let variation = fingerprintHash[0];

	const bucket = ratios.findIndex(r => {
		const scaled = r * ratioMultiplier;
		if (variation < scaled) {
			return true;
		} else {
			variation -= scaled;
			return false;
		}
	});

	if (bucket < 0) {
		return 0;
	}
	return bucket;
}

const hash = async (algorithm: 'SHA-1' | 'SHA-256' | 'SHA-512', message: string): Promise<Uint8Array> => {
	const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
	const hashBuffer = await crypto.subtle.digest(algorithm, msgUint8); // hash the message
	const hashArray = new Uint8Array(hashBuffer); // convert buffer to byte array
	return hashArray;
}
