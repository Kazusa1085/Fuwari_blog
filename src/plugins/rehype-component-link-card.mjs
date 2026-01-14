/// <reference types="mdast" />
import { h } from "hastscript";

/**
 * Creates a Link Card component.
 *
 * @param {Object} properties - The properties of the component.
 * @param {string} properties.url - The URL of the page.
 * @param {string} [properties.title] - The title of the page.
 * @param {string} [properties.description] - The description of the page.
 * @param {string} [properties.image] - The thumbnail image URL.
 * @returns {import('mdast').Parent} The created Link Card component.
 */
export function LinkCardComponent(properties) {
	if (!properties.url)
		return h(
			"div",
			{ class: "hidden" },
			'Invalid URL. ("url" attribute is required)',
		);

	const url = properties.url;
	const title = properties.title || url;
	const description = properties.description || "";
	const image = properties.image || "";

	const nTitle = h("div", { class: "lc-title" }, title);
	const nDescription = description
		? h("div", { class: "lc-description" }, description)
		: null;
	const nUrl = h("div", { class: "lc-url" }, [
		h("div", { class: "lc-icon" }),
		h("span", url),
	]);

	const nTextContainer = h("div", { class: "lc-text" }, [
		nTitle,
		nDescription,
		nUrl,
	]);

	const nImage = image
		? h("div", { class: "lc-image", style: `background-image: url(${image})` })
		: null;

	return h(
		"a",
		{
			class: `card-link no-styling ${image ? "has-image" : ""}`,
			href: url,
			target: "_blank",
			rel: "noopener noreferrer",
		},
		[nTextContainer, nImage],
	);
}
