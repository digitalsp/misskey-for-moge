/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineComponent, h, onMounted, ref } from 'vue';

type Props = {
	formula: string;
	displayMode?: boolean;
};

let katexModulePromise: Promise<typeof import('katex')> | null = null;
let cssLoaded = false;

async function loadKatex() {
	if (!katexModulePromise) {
		katexModulePromise = import('katex');
	}
	if (!cssLoaded) {
		cssLoaded = true;
		// CSS は一度だけ動的に読み込んで初回表示のみに限定する
		void import('katex/dist/katex.min.css');
	}
	return katexModulePromise;
}

export default defineComponent({
	name: 'MkKatex',
	props: {
		formula: {
			type: String,
			required: true,
		},
		displayMode: {
			type: Boolean,
			default: false,
		},
	},
	setup(props: Props) {
		const rendered = ref<string | null>(null);

		onMounted(async () => {
			try {
				const mod = await loadKatex();
				// ESM/CJS どちらでも動くように default を優先しつつ fallback
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const katex = (mod as any).default ?? mod;
				rendered.value = katex.renderToString(props.formula, {
					displayMode: props.displayMode ?? false,
					throwOnError: false,
					strict: 'ignore',
					trust: false,
					output: 'htmlAndMathml',
				});
			} catch (err) {
				console.error('katex render error', err);
				rendered.value = null;
			}
		});

		return () => {
			if (rendered.value == null) {
				return h('code', props.formula);
			}
			return h('span', {
				class: props.displayMode ? 'katex-display' : 'katex-inline',
				innerHTML: rendered.value,
			});
		};
	},
});

