if (!customElements.get('product-model')) {
  customElements.define(
    'product-model',
    class ProductModel extends DeferredMedia {
      constructor() {
        super();
      }

      loadContent() {
        // Add loading state
        this.classList.add('is-loading');
        super.loadContent();

        Shopify.loadFeatures([
          {
            name: 'model-viewer-ui',
            version: '1.0',
            onLoad: this.setupModelViewerUI.bind(this),
          },
        ]);
      }

      setupModelViewerUI(errors) {
        // Fallback: even if model-viewer-ui fails, show the model after timeout
        const modelViewer = this.querySelector('model-viewer');
        
        if (errors || !modelViewer) {
          // Release loading state immediately — model-viewer may still render without UI
          this.onModelLoaded();
          return;
        }

        this.modelViewerUI = new Shopify.ModelViewerUI(modelViewer);
        
        // Safety timeout: release loading state after 8s max
        var self = this;
        this._loadTimeout = setTimeout(function() { self.onModelLoaded(); }, 8000);
        
        // Listen for model load complete
        if (modelViewer.loaded) {
          this.onModelLoaded();
        } else {
          modelViewer.addEventListener('load', function() {
            self.onModelLoaded();
          });
        }
      }

      onModelLoaded() {
        // Clear safety timeout
        if (this._loadTimeout) {
          clearTimeout(this._loadTimeout);
          this._loadTimeout = null;
        }
        
        this.classList.remove('is-loading');
        this.classList.add('model-loaded');
        
        // Make the model viewer visible with entrance animation
        const modelViewer = this.querySelector('model-viewer');
        if (modelViewer) {
          modelViewer.classList.add('is-visible');
        }
      }
    }
  );
}

window.ProductModel = {
  loadShopifyXR() {
    Shopify.loadFeatures([
      {
        name: 'shopify-xr',
        version: '1.0',
        onLoad: this.setupShopifyXR.bind(this),
      },
    ]);
  },

  setupShopifyXR(errors) {
    if (errors) return;

    if (!window.ShopifyXR) {
      document.addEventListener('shopify_xr_initialized', () => this.setupShopifyXR());
      return;
    }

    document.querySelectorAll('[id^="ProductJSON-"]').forEach((modelJSON) => {
      window.ShopifyXR.addModels(JSON.parse(modelJSON.textContent));
      modelJSON.remove();
    });
    window.ShopifyXR.setupXRElements();
  },
};

window.addEventListener('DOMContentLoaded', () => {
  if (window.ProductModel) window.ProductModel.loadShopifyXR();
});
