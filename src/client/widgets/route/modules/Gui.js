export default class {
  config = {};
  autohideTimeout;

  constructor(config = {}) {
    this.setState(config);
  }

  setState(config) {
    this.config = config;

    typeof config.guiScale !== 'undefined'   && this.setScale(config.guiScale);
    typeof config.autohide !== 'undefined'   && this.setAutohide(config.autohide.enabled);
    typeof config.hide !== 'undefined'       && this.setHide(config.hide);
    typeof config.compact !== 'undefined'    && this.setCompact(config.compact);
    typeof config.themeColor !== 'undefined' && this.setColor(config.themeColor);
    typeof config.shadow !== 'undefined'     && this.setShadow(config.shadow);
    typeof config.fullColor !== 'undefined'  && this.setFullColor(config.fullColor);
  }

  setScale(scale) {
    document.documentElement.style.setProperty('--gui-scale', scale);
    this.config.guiScale = scale;
  }

  setCompact(compact) {
    document.documentElement.style.setProperty('--compact', compact ? 'var(--on)' : 'var(--off)');
    this.config.compact = compact;
  }

  setAutohide(autohide) {
    document.documentElement.classList.toggle('gui-autohide', autohide);
    this.config.autohide.enabled = autohide;
  }

  setHide(hide) {
    document.documentElement.classList.toggle('gui-hidden', hide);
    this.config.hide = hide;
  }

  setColor(color) {
    document.documentElement.style.setProperty('--color-theme', color);
    this.config.themeColor = color;
  }

  setShadow(isShadowOn) {
    document.documentElement.style.setProperty('--color-background', isShadowOn ? '#000C' : 'transparent');
    this.config.shadow = isShadowOn;
  }

  setFullColor(isFullColored) {
    document.documentElement.style.setProperty('--color-off', isFullColored ? 'var(--color-theme)' : 'var(--color-on)');
    document.documentElement.style.setProperty('--color-off-alpha', isFullColored ? '.5' : '.4');
    this.config.fullColor = isFullColored;
  }

  resetAutohideTimeout() {
    this.clearAutohideTimeout();
    if (this.config.autohide.delay) {
      this.autohideTimeout = setTimeout(() => document.documentElement.classList.add('gui-autohide--timeout'), this.config.autohide.delay * 1000);
    }
  }

  clearAutohideTimeout() {
    clearTimeout(this.autohideTimeout);
    document.documentElement.classList.remove('gui-autohide--timeout');
  }
}
