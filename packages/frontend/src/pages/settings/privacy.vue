<template>
<div class="_gaps_m">
	<MkSwitch v-model="isLocked" @update:model-value="save()">{{ i18n.ts.makeFollowManuallyApprove }}<template #caption>{{ i18n.ts.lockedAccountInfo }}</template></MkSwitch>
	<MkSwitch v-if="isLocked" v-model="autoAcceptFollowed" @update:model-value="save()">{{ i18n.ts.autoAcceptFollowed }}</MkSwitch>

	<MkSwitch v-model="publicReactions" @update:model-value="save()">
		{{ i18n.ts.makeReactionsPublic }}
		<template #caption>{{ i18n.ts.makeReactionsPublicDescription }}</template>
	</MkSwitch>
		
	<MkSelect v-model="ffVisibility" @update:model-value="save()">
		<template #label>{{ i18n.ts.ffVisibility }}</template>
		<option value="public">{{ i18n.ts._ffVisibility.public }}</option>
		<option value="followers">{{ i18n.ts._ffVisibility.followers }}</option>
		<option value="private">{{ i18n.ts._ffVisibility.private }}</option>
		<template #caption>{{ i18n.ts.ffVisibilityDescription }}</template>
	</MkSelect>
		
	<MkSwitch v-model="hideOnlineStatus" @update:model-value="save()">
		{{ i18n.ts.hideOnlineStatus }}
		<template #caption>{{ i18n.ts.hideOnlineStatusDescription }}</template>
	</MkSwitch>
	<MkSwitch v-model="noCrawle" @update:model-value="save()">
		{{ i18n.ts.noCrawle }}
		<template #caption>{{ i18n.ts.noCrawleDescription }}</template>
	</MkSwitch>
	<MkSwitch v-model="isExplorable" @update:model-value="save()">
		{{ i18n.ts.makeExplorable }}
		<template #caption>{{ i18n.ts.makeExplorableDescription }}</template>
	</MkSwitch>

	<FormSection>
		<div class="_gaps_m">
			<MkSwitch v-model="rememberNoteVisibility" @update:model-value="save()">{{ i18n.ts.rememberNoteVisibility }}</MkSwitch>
			<MkFolder v-if="!rememberNoteVisibility">
				<template #label>{{ i18n.ts.defaultNoteVisibility }}</template>
				<template v-if="defaultNoteVisibility === 'public'" #suffix>{{ i18n.ts._visibility.public }}</template>
				<template v-else-if="defaultNoteVisibility === 'home'" #suffix>{{ i18n.ts._visibility.home }}</template>
				<template v-else-if="defaultNoteVisibility === 'followers'" #suffix>{{ i18n.ts._visibility.followers }}</template>
				<template v-else-if="defaultNoteVisibility === 'specified'" #suffix>{{ i18n.ts._visibility.specified }}</template>

				<div class="_gaps_m">
					<MkSelect v-model="defaultNoteVisibility">
						<option value="public">{{ i18n.ts._visibility.public }}</option>
						<option value="home">{{ i18n.ts._visibility.home }}</option>
						<option value="followers">{{ i18n.ts._visibility.followers }}</option>
						<option value="specified">{{ i18n.ts._visibility.specified }}</option>
					</MkSelect>
					<MkSwitch v-model="defaultNoteLocalOnly">{{ i18n.ts._visibility.disableFederation }}</MkSwitch>
				</div>
			</MkFolder>

			<MkSwitch v-model="useDefaultNoteVisibilityOnRenote" @update:model-value="save()">Renoteにデフォルトの公開範囲を適用する</MkSwitch>
			<MkFolder v-if="!useDefaultNoteVisibilityOnRenote">
				<template #label>{{ i18n.ts.defaultNoteVisibility }} (Renote)  </template>
				<template v-if="defaultRenoteVisibility === 'public'" #suffix>{{ i18n.ts._visibility.public }}</template>
				<template v-else-if="defaultRenoteVisibility === 'home'" #suffix>{{ i18n.ts._visibility.home }}</template>
				<template v-else-if="defaultRenoteVisibility === 'followers'" #suffix>{{ i18n.ts._visibility.followers }}</template>
				<template v-else-if="defaultRenoteVisibility === 'specified'" #suffix>{{ i18n.ts._visibility.specified }}</template>

				<div class="_gaps_m">
					<MkSelect v-model="defaultRenoteVisibility">
						<option value="public">{{ i18n.ts._visibility.public }}</option>
						<option value="home">{{ i18n.ts._visibility.home }}</option>
						<option value="followers">{{ i18n.ts._visibility.followers }}</option>
						<option value="specified">{{ i18n.ts._visibility.specified }}</option>
					</MkSelect>
					<MkSwitch v-model="defaultRenoteLocalOnly">{{ i18n.ts._visibility.localOnly }}</MkSwitch>
				</div>
			</MkFolder>

			<MkFolder>
				<template #label>{{ i18n.ts.defaultNoteVisibility }} (数字引用 / パクる)</template>
				<template v-if="defaultNumberQuoteVisibility === 'inherits'" #suffix>元のノートに合わせる</template>
				<template v-if="defaultNumberQuoteVisibility === 'public'" #suffix>{{ i18n.ts._visibility.public }}</template>
				<template v-else-if="defaultNumberQuoteVisibility === 'home'" #suffix>{{ i18n.ts._visibility.home }}</template>
				<template v-else-if="defaultNumberQuoteVisibility === 'followers'" #suffix>{{ i18n.ts._visibility.followers }}</template>
				<template v-else-if="defaultNumberQuoteVisibility === 'specified'" #suffix>{{ i18n.ts._visibility.specified }}</template>

				<div class="_gaps_m">
					<MkSelect v-model="defaultNumberQuoteVisibility">
						<option value="inherits">元のノートに合わせる</option>
						<option value="public">{{ i18n.ts._visibility.public }}</option>
						<option value="home">{{ i18n.ts._visibility.home }}</option>
						<option value="followers">{{ i18n.ts._visibility.followers }}</option>
						<option value="specified">{{ i18n.ts._visibility.specified }}</option>
					</MkSelect>
					<MkSwitch v-if="defaultNumberQuoteVisibility !== 'inherits'" v-model="defaultNumberQuoteLocalOnly">{{ i18n.ts._visibility.localOnly }}</MkSwitch>
				</div>
			</MkFolder>
		</div>
	</FormSection>

	<MkSwitch v-model="keepCw" @update:model-value="save()">{{ i18n.ts.keepCw }}</MkSwitch>
</div>
</template>

<script lang="ts" setup>
import { } from 'vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkSelect from '@/components/MkSelect.vue';
import FormSection from '@/components/form/section.vue';
import MkFolder from '@/components/MkFolder.vue';
import * as os from '@/os';
import { defaultStore } from '@/store';
import { i18n } from '@/i18n';
import { $i } from '@/account';
import { definePageMetadata } from '@/scripts/page-metadata';

let isLocked = $ref($i.isLocked);
let autoAcceptFollowed = $ref($i.autoAcceptFollowed);
let noCrawle = $ref($i.noCrawle);
let isExplorable = $ref($i.isExplorable);
let hideOnlineStatus = $ref($i.hideOnlineStatus);
let publicReactions = $ref($i.publicReactions);
let ffVisibility = $ref($i.ffVisibility);

let defaultNoteVisibility = $computed(defaultStore.makeGetterSetter('defaultNoteVisibility'));
let defaultNoteLocalOnly = $computed(defaultStore.makeGetterSetter('defaultNoteLocalOnly'));
let rememberNoteVisibility = $computed(defaultStore.makeGetterSetter('rememberNoteVisibility'));
let keepCw = $computed(defaultStore.makeGetterSetter('keepCw'));
// #region Shrimpia
let defaultRenoteVisibility = $computed(defaultStore.makeGetterSetter('defaultRenoteVisibility'));
let defaultRenoteLocalOnly = $computed(defaultStore.makeGetterSetter('defaultRenoteLocalOnly'));
let useDefaultNoteVisibilityOnRenote = $computed(defaultStore.makeGetterSetter('useDefaultNoteVisibilityOnRenote'));
let defaultNumberQuoteVisibility = $computed(defaultStore.makeGetterSetter('defaultNumberQuoteVisibility'));
let defaultNumberQuoteLocalOnly = $computed(defaultStore.makeGetterSetter('defaultNumberQuoteLocalOnly'));

// #endregion

function save() {
	os.api('i/update', {
		isLocked: !!isLocked,
		autoAcceptFollowed: !!autoAcceptFollowed,
		noCrawle: !!noCrawle,
		isExplorable: !!isExplorable,
		hideOnlineStatus: !!hideOnlineStatus,
		publicReactions: !!publicReactions,
		ffVisibility: ffVisibility,
	});
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.privacy,
	icon: 'ti ti-lock-open',
});
</script>
