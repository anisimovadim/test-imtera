<script setup>
import {RouterLink, RouterView, useRoute} from 'vue-router'
import MenuComponent from '@/components/MenuComponent.vue'
import LogoutComponent from '@/components/LogoutComponent.vue'

const route = useRoute();
</script>

<template>
  <div class="app__container">
    <menu-component v-if="route.name !== 'auth'"/>
    <logout-component  v-if="route.name !== 'auth'"/>
    <router-view />
  </div>
</template>

<style scoped></style>
