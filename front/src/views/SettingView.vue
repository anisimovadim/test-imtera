<script setup>
import axios from '@/api.js';
import { ref } from "vue";
import {parseYandexReviews} from "@/services/yandexParser.js";

const url = ref('');
const isLoading = ref(false);
const error = ref("");
const message = ref("");
const reviews = ref([]);

const getReviews = async () => {
  if (!url.value) return error.value="Необходимо указать ссылку!";
  isLoading.value=true;
  error.value="";
  message.value = "";

  reviews.value = await parseYandexReviews(url.value);

  isLoading.value=false;
  console.log(reviews.value);
  // try {
  //   const res = await axios.get('/api/reviews', {
  //     params: { url: url.value }
  //   });
  //
  //   localStorage.setItem("reviews", JSON.stringify(res.data));
  //   console.log('Отзывы с бэка:', res.data);
  //   isLoading.value=false;
  //   error.value="";
  //   message.value="Ссылка активирована!";
  // } catch (e) {
  //   console.error('Ошибка получения отзывов:', e);
  //   isLoading.value=false;
  // }
}
</script>

<template>
  <div class="container">
    <h2>Подключить Яндекс</h2>
    <form @submit.prevent="getReviews">
      <div class="form-field form-field--yandex-link">
        <label for="yandexLink" class="form-field__label">
          Укажите ссылку на Яндекс, пример
          <a href="https://yandex.ru/maps/org/samoye_populyarnoye_kafe/1010501395/reviews/" target="_blank">
            https://yandex.ru/maps/org/samoye_populyarnoye_kafe/1010501395/reviews/
          </a>
        </label>
        <input
          type="text"
          class="form-field__input"
          id="yandexLink"
          placeholder="https://yandex.ru/maps/org/samoye_populyarnoye_kafe/1010501395/reviews/"
          v-model="url"
        />
        <div class="error" v-if="error">{{error}}</div>
        <div class="message" v-if="message">{{message}}</div>
        <button class="form-field__btn" :disabled="isLoading">{{isLoading ? "Подождите..." : "Сохранить"}}</button>
      </div>
    </form>
  </div>
</template>
