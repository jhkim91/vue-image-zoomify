import VueImageZoomify from "./VueImageZoomify.vue";

export default {
  install: (app, options) => {
    app.component("VueImageZoomify", VueImageZoomify);
  },
};

export { VueImageZoomify };
