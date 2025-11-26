<script setup>
import {ref} from "vue";
import axios from '@/api.js'
import router from "@/router/index.js";

const emit = defineEmits(["toggle"]);

const login = ref('');
const password = ref('');
const error = ref(null);

const auth = async ()=>{
  error.value = null;

  try{
    const res = await axios.post('/login', {
      login: login.value, password: password.value
    });
    localStorage.setItem('token', res.data.token);
    router.push({name: 'setting'});
  } catch (e){
    error.value = e.response?.data;
    console.log(error.value);
  }
}
</script>

<template>
  <div class="login__container">
    <h2 class="login__title">Авторизация</h2>
    <form class="login__form" @submit.prevent="auth">
      <div class="form-field">
        <div class="login__form-item">
          <label for="login">Логин</label>
          <input type="text" name="login" id="login" v-model="login">
          <div class="error" v-if="error?.errors?.login">
            {{String(error?.errors?.login)}}
          </div>
        </div>
        <div class="login__form-item">
          <label for="password">Пароль</label>
          <input type="password" name="password" id="password" v-model="password">
          <div class="error" v-if="error?.errors?.password">
            {{String(error?.errors?.password)}}
          </div>
        </div>
        <div class="login__form-btn">
          <button>Вход</button>
        </div>
        <div class="error" v-if="!error?.errors">
          {{error?.message}}
        </div>
        <div class="login__form-quest" @click="emit('toggle')">
          Нет аккаунта?
        </div>
      </div>
    </form>
  </div>
</template>

<style scoped>

</style>
