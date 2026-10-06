<script setup lang="ts">
// Docus footer with added documentation links.
const links = [
  { label: 'Documentation', to: '/getting-started/introduction' },
  { label: 'API reference', to: '/reference/provider-api' },
  { label: 'Developers', to: '/developers' },
]
</script>

<template>
  <UFooter>
    <template #left>
      <AppFooterLeft />
    </template>

    <nav aria-label="Documentation">
      <ul class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
        <li
          v-for="link of links"
          :key="link.to"
        >
          <ULink
            :to="link.to"
            class="text-muted hover:text-highlighted transition-colors"
          >
            {{ link.label }}
          </ULink>
        </li>
      </ul>
    </nav>

    <template #right>
      <AppFooterRight />
    </template>
  </UFooter>
</template>
