<script setup>
import {RouterLink, RouterView, useRoute} from 'vue-router'
import MenuComponent from '@/components/MenuComponent.vue'
import LogoutComponent from '@/components/LogoutComponent.vue'
import axios from '@/api.js'
import {onMounted, ref, watch} from "vue";
import router from "@/router/index.js";

const route = useRoute();
const loadedOnce = ref(false);
const user = ref(null);
const isLoad = ref(true);

const getAuthUser = async () =>{
  try{
    const res = await axios.get('/user');
    user.value=res.data;
    loadedOnce.value = true;
    isLoad.value=false;
  } catch (e){
    loadedOnce.value = false;
    router.push({name: 'auth'});
  }
}

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
    <menu-component v-if="route.name !== 'auth' && !isLoad" :account-name="user.account_name"/>
    <logout-component  v-if="route.name !== 'auth'" @reset-auth-flag="resetLoadedOnce"/>
    <router-view />
  </div>
</template>

<style scoped></style>
