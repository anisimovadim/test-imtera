<script setup>

import LoginComponent from "@/components/LoginComponent.vue";
import RegisterComponent from "@/components/RegisterComponent.vue";
import {ref} from "vue";

const has_register = ref(true);

const toggle = () => {
  has_register.value = !has_register.value;
};
</script>

<template>
<div class="auth__container">
  <login-component v-if="has_register"  @toggle="toggle"/>
  <register-component v-else @toggle="toggle"/>
</div>
</template>

<style scoped>

</style>
