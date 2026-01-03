<script lang="ts">
import { onMount } from "svelte";

import I18nKey from "../i18n/i18nKey";
import { i18n } from "../i18n/translation";
import { getGalleryUrlBySlug } from "../utils/url-utils";

export let sortedGalleries: Gallery[] = [];

const params = new URLSearchParams(window.location.search);
let tags: string[] = params.has("tag") ? params.getAll("tag") : [];

interface Gallery {
	slug: string;
	data: {
		title: string;
		tags: string[];
		published: Date;
		location?: string;
	};
}

interface Group {
	year: number;
	galleries: Gallery[];
}

let groups: Group[] = [];

function formatDate(date: Date) {
	const month = (date.getMonth() + 1).toString().padStart(2, "0");
	const day = date.getDate().toString().padStart(2, "0");
	return `${month}-${day}`;
}

function formatTag(tagList: string[]) {
	return tagList.map((t) => `#${t}`).join(" ");
}

onMount(async () => {
	let filteredGalleries: Gallery[] = sortedGalleries;

	if (tags.length > 0) {
		filteredGalleries = filteredGalleries.filter(
			(gallery) =>
				Array.isArray(gallery.data.tags) &&
				gallery.data.tags.some((tag) => tags.includes(tag)),
		);
	}

	const grouped = filteredGalleries.reduce(
		(acc, gallery) => {
			const year = gallery.data.published.getFullYear();
			if (!acc[year]) {
				acc[year] = [];
			}
			acc[year].push(gallery);
			return acc;
		},
		{} as Record<number, Gallery[]>,
	);

	const groupedGalleriesArray = Object.keys(grouped).map((yearStr) => ({
		year: Number.parseInt(yearStr, 10),
		galleries: grouped[Number.parseInt(yearStr, 10)],
	}));

	groupedGalleriesArray.sort((a, b) => b.year - a.year);

	groups = groupedGalleriesArray;
});
</script>

<div class="card-base px-8 py-6">
    {#each groups as group}
        <div>
            <div class="flex flex-row w-full items-center h-[3.75rem]">
                <div class="w-[15%] md:w-[10%] transition text-2xl font-bold text-right text-75">
                    {group.year}
                </div>
                <div class="w-[15%] md:w-[10%]">
                    <div
                            class="h-3 w-3 bg-none rounded-full outline outline-[var(--primary)] mx-auto
                  -outline-offset-[2px] z-50 outline-3"
                    ></div>
                </div>
                <div class="w-[70%] md:w-[80%] transition text-left text-50">
                    {group.galleries.length} {group.galleries.length === 1 ? "gallery" : "galleries"}
                </div>
            </div>

            {#each group.galleries as gallery}
                <a
                        href={getGalleryUrlBySlug(gallery.slug)}
                        aria-label={gallery.data.title}
                        class="group btn-plain !block h-10 w-full rounded-lg hover:text-[initial]"
                >
                    <div class="flex flex-row justify-start items-center h-full">
                        <!-- date -->
                        <div class="w-[15%] md:w-[10%] transition text-sm text-right text-50">
                            {formatDate(gallery.data.published)}
                        </div>

                        <!-- dot and line -->
                        <div class="w-[15%] md:w-[10%] relative dash-line h-full flex items-center">
                            <div
                                    class="transition-all mx-auto w-1 h-1 rounded group-hover:h-5
                       bg-[oklch(0.5_0.05_var(--hue))] group-hover:bg-[var(--primary)]
                       outline outline-4 z-50
                       outline-[var(--card-bg)]
                       group-hover:outline-[var(--btn-plain-bg-hover)]
                       group-active:outline-[var(--btn-plain-bg-active)]"
                            ></div>
                        </div>

                        <!-- gallery title -->
                        <div
                                class="w-[70%] md:max-w-[65%] md:w-[65%] text-left font-bold
                     group-hover:translate-x-1 transition-all group-hover:text-[var(--primary)]
                     text-75 pr-8 whitespace-nowrap overflow-ellipsis overflow-hidden"
                        >
                            {gallery.data.title}
                        </div>

                        <!-- tag list -->
                        <div
                                class="hidden md:block md:w-[15%] text-left text-sm transition
                     whitespace-nowrap overflow-ellipsis overflow-hidden text-30"
                        >
                            {formatTag(gallery.data.tags)}
                        </div>
                    </div>
                </a>
            {/each}
        </div>
    {/each}
</div>

