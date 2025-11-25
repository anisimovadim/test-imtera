<script setup>
import {ref} from "vue";
import axios from '@/api.js'
import router from "@/router/index.js";

const emit = defineEmits(["toggle"]);

const login = ref('');
const password = ref('');
const account_name = ref('');
const errors = ref(null);

const register = async ()=>{
  errors.value = null;

  try{
    await axios.post('/api/register', {
      login: login.value,
      password: password.value,
      account_name: account_name.value
    });

    emit('toggle');
  } catch (e){
    errors.value = e.response?.data?.errors;
    console.log(errors.value);
  }
}
</script>

<template>
  <div class="login__container">
    <h2 class="login__title">Регистрация</h2>
    <form class="login__form" @submit.prevent="register">
      <div class="login__form-item">
        <label for="account_name">Название аккаунта</label>
        <input type="text" name="account_name" id="account_name" v-model="account_name">
        <div class="error" v-if="errors?.account_name">
          {{String(errors?.account_name)}}
        </div>
      </div>
      <div class="login__form-item">
        <label for="login">Логин</label>
        <input type="text" name="login" id="login" v-model="login">
        <div class="error" v-if="errors?.login">
          {{String(errors?.login)}}
        </div>
      </div>
      <div class="login__form-item">
        <label for="password">Пароль</label>
        <input type="password" name="password" id="password" v-model="password">
        <div class="error" v-if="errors?.password">
          {{String(errors?.password)}}
        </div>
      </div>
      <div class="login__form-btn">
        <button>Зарегистрироваться</button>
      </div>
      <div class="login__form-quest" @click="emit('toggle')">
        У меня уже есть аккаунт
      </div>
    </form>
  </div>
</template>

<style scoped>

</style>
