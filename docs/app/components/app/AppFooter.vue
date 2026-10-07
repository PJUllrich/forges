<script setup lang="ts">
const { data: contributors } = await useFetch('/api/footer-contributors', {
  default: () => [{ login: 'danielroe', to: 'https://github.com/danielroe' }],
})

const links = [
  { label: 'Documentation', to: '/getting-started/introduction' },
  { label: 'API reference', to: '/reference/provider-api' },
  { label: 'Developers', to: '/developers' },
]
</script>

<template>
  <UFooter>
    <template #left>
      <p class="flex flex-wrap items-center justify-center gap-1 text-sm text-muted">
        <span>made with <span aria-label="love">♥</span> by</span>
        <span>
          <template
            v-for="(contributor, index) of contributors"
            :key="contributor.login"
          >
            <ULink
              :to="contributor.to"
              class="hover:text-highlighted transition-colors"
            >{{ contributor.login }}</ULink>{{ index < contributors.length - 2 ? ', ' : index === contributors.length - 2 ? ' and ' : '' }}
          </template>
        </span>
        <span aria-hidden="true">·</span>
        <ULink
          to="https://github.com/danielroe/forges/blob/main/LICENCE"
          class="hover:text-highlighted transition-colors"
        >
          MIT
        </ULink>
        <span aria-hidden="true">·</span>
        <ULink
          to="https://github.com/danielroe/forges"
          class="hover:text-highlighted transition-colors"
        >
          source
        </ULink>
      </p>
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
