<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/vue';
import { ref, reactive } from "vue";
import { StreamBarcodeReader } from "vue-barcode-reader";
import axios from "axios";
import { Product } from '../types/product';
import { Camera } from '@capacitor/camera';
import { scanCircleSharp, searchOutline } from 'ionicons/icons';

const EAN = ref('')
const showScanner = ref(false)
const requestMade = ref(false)
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

const toggleScanner = async () => {
  const { camera } = await Camera.requestPermissions();

  if (camera === 'granted') {
    showScanner.value = !showScanner.value;
  } else {
    console.log('Camera permission was not granted.');
  }
}

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
        <ion-title>Tab 1</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-img src="https://upload.wikimedia.org/wikipedia/commons/1/1c/Pinialogo.svg" alt="Logo" slot="start"></ion-img>
          <ion-title size="large">Yukananas</ion-title>
        </ion-toolbar>
      </ion-header>
      <StreamBarcodeReader v-if="showScanner" class="reader" @decode="onDecode" @loaded="onLoaded"></StreamBarcodeReader>
      <div class="input-container">
    <input type="tel" v-model="EAN" class="input-field">
    <div class="button-container">
      <ion-button fill="clear" @click="EANrequest"><ion-icon :icon="searchOutline" size="large"></ion-icon></ion-button>
      <ion-button fill="clear" @click="toggleScanner"><ion-icon :icon="scanCircleSharp" size="large"></ion-icon></ion-button>
    </div>
    </div>    
      <div v-if="requestMade">
        <ion-card>
          <ion-card-header>
            <ion-card-title>{{ product.product_name }}</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <img :src="product.image_url" alt="">
            <p v-if="product.brand.includes(',')">Marques : {{ product.brand }}</p>
            <p v-else>Marque : {{ product.brand }}</p>
            <p class="nutriscore">Nutriscore : {{ product.nutriscore_grade }}</p>
            <p>Ingrédients : {{ product.ingredients.join(', ') }}</p>
            <p>Allergènes : {{ product.allergens.join(', ') }}</p>
            <p>Empreinte carbone : {{ product.carbon_footprint }}g CO²</p>
            <p>{{ product.tags.join(', ') }}</p>
            <p>Taux de sucre : {{ product.sugar }}g pour 100g</p>
            <p>Quantité: {{ product.quantity }}</p>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.nutriscore {
  text-transform: capitalize;
}
.input-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}

.button-container {
  display: flex;
}

.input-field {
  background-color: #fefef7;
  color: #1e1e1e;
  width: 50%;
  height: 2rem;
  font-size: 1.2rem;
  border: none;
  border-radius: 1rem;
  text-align: center;

}
img {
  border-radius: .5rem;
}
ion-toolbar {
  margin-left: 1.5rem;
}
ion-title {
  font-size: 3.5rem;
}
ion-img {
  height: 64px;
}
</style>