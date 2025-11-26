<script setup>
import solid from '@/components/icons/star_solid.svg'
import outline from '@/components/icons/star_outline.svg'
import {onMounted, ref} from 'vue'
const props = defineProps({
  userSetting: {
    type:Object,
  }
})
const rating = ref(5);
const averageRating = ref(4.7);
const amountRating = ref(1145);
const reviews = ref('');

onMounted(()=>{
  reviews.value = JSON.parse(localStorage.getItem("reviews"));
})
</script>

<template>
  <div class="container">
    <div class="comments" v-if="userSetting?.comments">
      <div class="comments__tag">
        <div class="comments__tag-icon">
          <img src="@/components/icons/yandex_maps.svg" alt="" />
        </div>
        <div class="comments__tag-text">Яндекс Карты</div>
      </div>
      <div class="comments__box">
        <div class="comments__list">
          <div class="comments__item" v-for="comment in userSetting.comments">
            <div class="comments__item-background">
              <div class="comments__item-header">
                <div class="comments__item-header-text">
                  <span class="comments__item-datetime"> {{comment.date}} </span>
                  <span class="comments__item-filial"> {{userSetting.filial_name}} </span>
                  <div class="comments__item-icon">
                    <img src="@/components/icons/yandex_maps.svg" alt="" />
                  </div>
                </div>
                <div class="comments__item-header-stars">
                  <ul class="stars">
                    <li v-for="i in 5" :key="i">
                      <img :src="i <= comment.rating ? solid : outline" alt="" />
                    </li>
                  </ul>
                </div>
              </div>
              <div class="comments__item-body">
                <div class="comments__item-author">
                  <div class="comments__item-author-name">{{comment.author}}</div>
<!--                  <div class="comments__item-author-phone">+7 900 540 40 40</div>-->
                </div>
                <div class="comments__item-text" v-html="comment.text"></div>
              </div>
            </div>
          </div>
        </div>
        <div class="comments__rating">
          <div class="rating">
            <div class="rating__grade">
              <div class="rating__count">{{ userSetting.average_rating }}</div>
              <div class="rating__stars">
                <ul class="rating__stars-list">
                  <li class="rating__star" v-for="i in 5" :key="i">
                    <img :src="i <= Math.floor(userSetting.average_rating) ? solid : outline" alt="" />
                  </li>
                </ul>
              </div>
            </div>

            <div class="rating__amount">
              Всего отзывов:
              <span class="rating__amount-int">{{ userSetting.total_reviews }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="warning" v-else>
      Вставьте ссылку в разделе <b>"Отзывы"</b>
    </div>
  </div>
</template>

<style scoped></style>
