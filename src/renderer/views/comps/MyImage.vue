<template>
    <img :src="base64Src" :width="imgWidth" :height="imgHeight"/>
</template>
<script>
const fs = require("fs-extra");
const Jimp = require("jimp");
export default {
  name: "MyImage",
  props: {
    width: [String, Number],
    height: [String, Number],
    src: String
  },
  data() {
    return {
      base64Src: "",
      imgWidth: this.width,
      imgHeight: this.height
    };
  },
  mounted: async function() {
    if (this.src) {
      this.updateBase64Src(this.src);
    }
  },
  watch: {
    src: function(path) {
      this.updateBase64Src(path);
    }
  },
  methods: {
    updateBase64Src(path) {
      if (path) {
        let buff = fs.readFileSync(path);
        Jimp.read(buff)
          .then(img => {
            img.getBase64(Jimp.MIME_PNG, (err, src) => {
              this.base64Src = src;
            });
          })
          .catch(err => {})
      }else{
          this.base64Src=""
      }
    }
  }
};
</script>