# Static AB Worker

CloudCannon's example Cloudflare worker for running A/B tests on a static website.

## Defining an experiment:

```html
<div data-ab-define="Money Money Money" data-ab-ratio="60:40"> ... </div>

<div data-ab-define="The Winner Takes It All" data-ab-ratio="1:1:6:3"> ... </div>
```

These attributes do **not** need to wrap the experiment, they just need to be defined
somewhere on the page before the variations. This allows you to spread a single test
across the page, rather than being limited to the contents of one element.

Ratios do not need to sum to any specific number.

These attributes will always be removed by the AB worker when serving the page.

The `data-ab-define` and `data-ab-ratio` attributes must always be paired on the same element.

## Defining a variation

```html
<div data-ab-reference="The Winner Takes It All" data-ab-variation="0"> ... </div>
<template data-ab-reference="The Winner Takes It All" data-ab-variation="1"> <div> ... </div> </template>
<template data-ab-reference="The Winner Takes It All" data-ab-variation="2"> <div> ... </div> </template>
<template data-ab-reference="The Winner Takes It All" data-ab-variation="3"> <div> ... </div> </template>
```

These attributes reference a previously defined experiment. They do not need to be unique, so multiple elements
can claim to be variation `0` of a given experiment. Variations are zero-indexed, based on the how many ratios were provided when defining the experiment.

- If placed on a standard element, and the variation is not picked, the element will be removed from the page by the AB worker.
- If placed on a standard element, and the variation is picked, the attributes will be removed from the element by the AB worker.
- If placed on a template element, and the variation is not picked, the element will be removed from the page by the AB worker.
- If placed on a template element, and the variation is picked, the template element will be replaced with its contents.

The `data-ab-reference` and `data-ab-variation` attributes must always be paired on the same element.

## Examples

```html
<!-- 50/50 test, grouped inside a component -->
<div data-ab-define="Take A Chance On A New Heading" data-ab-ratio="50:50">

    <h1 data-ab-reference="Take A Chance On A New Heading" data-ab-variation="0">We can go dancing</h1>

    <template data-ab-reference="Take A Chance On A New Heading" data-ab-variation="1">
        <h1>We can go walking</h1>
    </template>

</div>
```

```html
<!-- even thirds, testing position on a page -->
<span data-ab-define="Voyage of a CTA" data-ab-ratio="5:5:5"></span>

<h1>He likes the lilacs in my garden</h1>

<button data-ab-reference="Voyage of a CTA" data-ab-variation="0"> ✨ CTA ✨ </button>

<h2>I love to watch him fly</h2>

<button data-ab-reference="Voyage of a CTA" data-ab-variation="1"> ✨ CTA ✨ </button>

<h3>He's just a tiny, fuzzy ball</h3>

<button data-ab-reference="Voyage of a CTA" data-ab-variation="2"> ✨ CTA ✨ </button>
```

## Notes

- If you define fewer `data-ab-variation` elements than sections in your `data-ab-ratio`, you may end up with no elements on the page for this experiment.
- Variations are stable for a given IP + user agent + defined experiment.
  - This means you can use the same `data-ab-define` and `data-ab-ratio` attributes on multiple pages across the site, and users will be assigned the same variation.
- Whether to put subsequent variations inside `<template>` elements is entirely situation-dependent.
  - Only one element will make it through the proxy in any case, so this choice only affects whether multiple variations are visible when live editing, and on a staging or testing domain without the worker running.
