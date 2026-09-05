<script setup lang="ts">
interface Props {
  lang: string
}

defineProps<Props>()
</script>

<template>
  <main
    class="flex min-h-dvh items-center justify-center bg-stone-100 px-6 py-12 text-stone-950 dark:bg-stone-950 dark:text-stone-100"
    :lang="lang"
  >
    <slot />
  </main>
</template>
