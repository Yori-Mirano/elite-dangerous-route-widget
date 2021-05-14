export default class {
  config = {};
  notificationTimeout;
  notificationThrottle = 250;
  inGameMenuFocus = false;
  onChange;
  onShow;
  onHide;

  constructor(config = {}) {
    this.setState(config);
  }

  setState(config) {
    this.config = config;

    typeof config.guiScale !== 'undefined'   && this.setScale(config.guiScale);
    typeof config.autohide !== 'undefined'   && this.setAutohide(config.autohide);
    typeof config.hide !== 'undefined'       && this.setHide(config.hide);
    typeof config.compact !== 'undefined'    && this.setCompact(config.compact);
    typeof config.themeColor !== 'undefined' && this.setColor(config.themeColor);
    typeof config.shadow !== 'undefined'     && this.setShadow(config.shadow);
    typeof config.fullColor !== 'undefined'  && this.setFullColor(config.fullColor);

    this.updateAutohide();
  }

  notifyChanges() {
    clearTimeout(this.notificationTimeout);

    this.notificationTimeout = setTimeout(() => {
      if (typeof this.onChange === 'function') {
        this.onChange(this.config);
      }
      this.updateAutohide();
    }, this.notificationThrottle);
  }

  setScale(scale) {
    document.documentElement.style.setProperty('--gui-scale', scale);
    document.getElementById('config-panel__gui-scale').value = scale;
    document.getElementById('config-panel__gui-scale__value').innerHTML = Number.parseFloat(scale).toFixed(1);

    if (this.config.guiScale !== scale) {
      this.config.guiScale = scale;
      this.notifyChanges();
    }
  }

  setCompact(compact) {
    document.documentElement.style.setProperty('--compact', compact ? 'var(--on)' : 'var(--off)');
    document.getElementById('config-panel__compact').checked = compact;

    if (this.config.compact !== compact) {
      this.config.compact = compact;
      this.notifyChanges();
    }
  }

  setAutohide(autohide) {
    if (this.config.autohide !== autohide) {
      this.config.autohide = autohide;
      this.notifyChanges();
    }
  }

  setHide(hide) {
    if (this.config.hide !== hide) {
      this.config.hide = hide;
      this.notifyChanges();
    }
  }

  setColor(color) {
    document.documentElement.style.setProperty('--color-theme', color);
    document.getElementById('config-panel__theme-color').value = color;

    if (this.config.themeColor !== color) {
      this.config.themeColor = color;
      this.notifyChanges();
    }
  }

  setShadow(isShadowOn) {
    document.documentElement.style.setProperty('--color-background', isShadowOn ? '#000C' : 'transparent');
    document.getElementById('config-panel__shadow').checked = isShadowOn;  

    if (this.config.shadow !== isShadowOn) {
      this.config.shadow = isShadowOn;
      this.notifyChanges();
    }
  }

  setFullColor(isFullColored) {
    document.documentElement.style.setProperty('--color-off', isFullColored ? 'var(--color-theme)' : 'var(--color-on)');
    document.documentElement.style.setProperty('--color-off-alpha', isFullColored ? '.5' : '.4');
    document.getElementById('config-panel__full-color').checked = isFullColored;  

    if (this.config.fullColor !== isFullColored) {
      this.config.fullColor = isFullColored;
      this.notifyChanges();
    }
  }

  updateAutohide(inGameMenuFocus = null) {
    if (inGameMenuFocus) {
      this.inGameMenuFocus = inGameMenuFocus;
    }

    if (this.config.hide) {
      this.hide();
    } else {
      if (this.config.autohide) {
        if (this.inGameMenuFocus) {
          this.hide();
        } else {
          this.show();
        }
      } else {
        this.show();
      }
    }
  }

  show() {
    if (typeof this.onShow === 'function') {
      this.onShow(this.steps);
    }
  }

  hide() {
    if (typeof this.onHide === 'function') {
      this.onHide(this.steps);
    }
  }
}