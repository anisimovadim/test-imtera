<script setup>
import axios from '@/api.js'
import router from "@/router/index.js";


const logout = async () => {
  try{
    await axios.post('/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('reviews');
    router.push({name:'auth'});
  } catch (e){
    console.log(e);
  }
}

</script>

<template>
  <div class="logout">
    <div class="logout__icon" @click="logout">
      <img src="@/components/icons/logout.svg" alt="" />
    </div>
  </div>
</template>

<style scoped></style>
