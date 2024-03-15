<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonToast } from '@ionic/vue';
import { ref, reactive, onBeforeMount, onUnmounted } from "vue";
import { StreamBarcodeReader } from "vue-barcode-reader";
import axios from "axios";
import { Product } from '../types/product';
import { Camera } from '@capacitor/camera';

const EAN = ref('')
const showScanner = ref(true)
const requestMade = ref(false)
const showToast = ref(false)
const product = reactive<Product>({
  product_name: '',
  brand: [],
  ingredients: [],
  allergens: [],
  carbon_footprint: '',
  nutriscore_grade: '',
  sugar: '',
  quantity: '',
  tags: [],
  image_url: ''
});

const onDecode = (text: string) => {
  EAN.value = text;
  console.log(text);
  showScanner.value = false;
  EANrequest();
}

const onLoaded = () => {
  console.log('Scanner Ready!');
}

onBeforeMount(async () => {
  const { camera } = await Camera.requestPermissions();

  if (camera !== 'granted') {
    console.log('Camera permission was not granted.');
    showScanner.value = false;
  }
})

onUnmounted (() => {
  showScanner.value = false
})

const EANrequest = async () => {
  try {
    requestMade.value = true
    const response = await axios.get(`https://world.openfoodfacts.org/api/v0/product/${EAN.value}`);
    const result = response.data;
    console.log(result);
    if (result.product) {
      product.product_name = result.product.product_name;
      product.brand = result.product.brands;
      product.sugar = result.product.nutriscore_data.sugars
      product.quantity = result.product.quantity
      product.nutriscore_grade = result.product.nutriscore_grade
      product.ingredients = result.product.ingredients.map((ingredient: any) => ingredient.text.replace(/_/g, ' '));
      product.allergens = Array.from(new Set(result.product.allergens_from_ingredients.split(', ')))
        .map((allergen: unknown) => (allergen as string).replace('en:', '')) as string[];   
      product.carbon_footprint = result.product.carbon_footprint_percent_of_known_ingredients   
      const transformedTags = result.product.ingredients_analysis_tags.map((tag: any) => {
        switch (tag) {
          case 'en:palm-oil-free':
            return 'Sans huile de palme';
          case 'en:palm-oil': 
            return 'Huile de palme';
          case 'en:vegan-status-unknown':
            return 'Caractère végétalien inconnu'
          case 'en:vegan':
            return 'Végétalien';
          case 'en:non-vegan': 
            return 'Non Végétalien';
          case 'en:maybe-vegan': 
            return 'Peut-être végétalien'
            case 'en:vegetarian-status-unknown':
              return 'Caractère végétarien inconnu'
          case 'en:vegetarian':
            return 'Végétarien';
          case 'en:maybe-vegetarian':
            return `Peut-être végétarien`
          default:
            return tag;
        }
      });
      product.tags = transformedTags
      product.image_url = result.product.image_url;
      showToast.value = true;
    }
  } catch (error) {
    console.error(error);
  }
  console.log(product);
}
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Tab 2</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Tab 2</ion-title>
        </ion-toolbar>
      </ion-header>
      <StreamBarcodeReader v-if="showScanner" @decode="onDecode" @loaded="onLoaded" />
      <IonToast
        v-if="showToast"
        :isOpen="true"
        :message="`Product: ${product.product_name}, Brand: ${product.brand}`"
        position="bottom"
        duration="5000"
      >
        <div>
          <img :src="product.image_url" alt="Product Image" />
        </div>
      </IonToast>
    </ion-content>
  </ion-page>
</template>