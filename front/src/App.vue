<script setup>
import {RouterLink, RouterView, useRoute} from 'vue-router'
import MenuComponent from '@/components/MenuComponent.vue'
import LogoutComponent from '@/components/LogoutComponent.vue'
import axios from '@/api.js'
import {onMounted, ref, watch} from "vue";
import router from "@/router/index.js";

const route = useRoute();
const loadedOnce = ref(false);
const userSetting = ref(null);
const isLoad = ref(true);

const getAuthUser = async () => {
  try {
    const res = await axios.get('/user');
    userSetting.value = res.data;
    loadedOnce.value = true;
    isLoad.value = false;
    console.log(userSetting.value);
  } catch (e) {
    loadedOnce.value = false;
    isLoad.value = false;

    localStorage.removeItem('token');
    localStorage.removeItem('reviews');
    router.push({ name: 'auth' });
  }
};


onMounted(()=>{
  if (route.name !== 'auth'){
    getAuthUser();
  }
})

watch(
  () => route.name,
  (newName, oldName) => {
    if (!loadedOnce.value && oldName === 'auth' && newName !== 'auth') {
      getAuthUser();
    }
    console.log(route.name)
  }
);

const resetLoadedOnce = () => {
  loadedOnce.value = false;   // <--- СБРОС
};
</script>

<template>
  <div class="app__container">
    <menu-component v-if="route.name !== 'auth' && !isLoad" :account-name="userSetting?.user?.account_name"/>
    <logout-component  v-if="route.name !== 'auth'" @reset-auth-flag="resetLoadedOnce"/>
    <router-view v-slot="{Component}">
      <component :is="Component" :userSetting="userSetting" @update-user="getAuthUser"/>
    </router-view>
  </div>
</template>

<style scoped></style>
