import StaticAB from './static_ab';

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		return StaticAB(request, env, ctx);
	},
};
