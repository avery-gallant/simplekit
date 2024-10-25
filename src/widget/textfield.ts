import { SKKeyboardEvent, SKMouseEvent } from "../events";
import { measureText } from "../utility";
import { requestKeyboardFocus } from "../dispatch";
import { SKElement, SKElementProps } from "./element";
import { Style } from "./style";

export type SKTextfieldProps = SKElementProps & {
  text?: string;
};

export class SKTextfield extends SKElement {
  constructor({ text = "", fill = "white", ...elementProps }: SKTextfieldProps = {}) {
    super(elementProps);
    this.padding = Style.textPadding;
    this.text = text;
    this.fill = fill;
  }

  state: "idle" | "hover" = "idle";
  focus = false;

  protected _text = "";
  get text() {
    return this._text;
  }
  set text(t: string) {
    this._text = t;
    this.setMinimalSize(this.width, this.height);
  }

  protected _radius = 0;
  set radius(r: number) {
    this._radius = r;
  }
  get radius() {
    return this._radius;
  }

  protected _font = Style.font;
  set font(s: string) {
    this._font = s;
    this.setMinimalSize(this.width, this.height);
  }
  get font() {
    return this._font;
  }

  protected _fontColour = Style.fontColour;
  set fontColour(c: string) {
    this._fontColour = c;
  }
  get fontColour() {
    return this._fontColour;
  }

  protected _highlightColour = Style.highlightColour;
  set highlightColour(hc: string){
    this._highlightColour = hc;
  }

  setMinimalSize(width?: number, height?: number) {
    // need this if w or h not specified
    const m = measureText(this.text || " ", this.font);

    if (!m) {
      console.warn(
        `measureText failed in SKTextfield for ${this.text}`
      );
      return;
    }

    this.height = height || m.height + this.padding * 2;
    this.width = width || m.width + this.padding * 2;
    // need to store this for cursor position
    this.textWidth = m.width;
  }

  textWidth = 0;

  protected applyEdit(text: string, key: string): string {
    if (key == "Backspace") {
      return text.slice(0, -1);
    } else if (key.length == 1) {
      return text + key;
    } else return text;
  }

  handleKeyboardEvent(ke: SKKeyboardEvent) {
    switch (ke.type) {
      case "focusout":
        this.focus = false;
        return true;
        break;
      case "focusin":
        this.focus = true;
        return true;
        break;
      case "keydown":
        if (this.focus && ke.key) {
          this.text = this.applyEdit(this.text, ke.key);
        }
        return this.sendEvent({
          source: this,
          timeStamp: ke.timeStamp,
          type: "textchanged",
        });
        break;
    }

    return false;
  }

  handleMouseEvent(me: SKMouseEvent) {
    switch (me.type) {
      case "mouseenter":
        this.state = "hover";
        return true;
        break;
      case "mouseexit":
        this.state = "idle";
        return true;
        break;
      case "click":
        requestKeyboardFocus(this);
        return true;
        break;
      case "mousedown":
        return false;
        break;
      case "mouseup":
        return false;
        break;
    }
    return false;
  }

  draw(gc: CanvasRenderingContext2D) {
    const w = this.paddingBox.width;
    const h = this.paddingBox.height;

    gc.save();

    gc.translate(this.x, this.y);
    gc.translate(this.margin, this.margin);

    // thick highlight rect
    if (this.state == "hover") {
      gc.beginPath();
      gc.roundRect(0, 0, w, h, this._radius);
      gc.strokeStyle = this._highlightColour;
      gc.lineWidth = 8;
      gc.stroke();
    }

    // border
    gc.beginPath();
    gc.roundRect(0, 0, w, h, this._radius);
    gc.fillStyle = this.fill;
    gc.fill();
    gc.lineWidth = 1;
    gc.strokeStyle = this.focus ? "mediumblue" : "black";
    gc.stroke();
    // clip text if it's wider than text area
    // TODO: could scroll text if it's wider than text area
    gc.clip();

    // text
    gc.font = this._font;
    gc.fillStyle = this._fontColour;
    gc.textBaseline = "middle";
    gc.textAlign = "left";
    gc.fillText(this.text, this.padding, h / 2);

    // simple cursor
    if (this.focus) {
      const cursorX = this.padding + this.textWidth + 1;
      const cursorHeight = h - Style.textPadding;
      gc.beginPath();
      gc.moveTo(cursorX, Style.textPadding / 2);
      gc.lineTo(cursorX, cursorHeight);
      gc.lineWidth = 1;
      gc.strokeStyle = this._font;
      gc.stroke();
    }

    gc.restore();

    // element draws debug viz if flag is set
    super.draw(gc);
  }

  public toString(): string {
    return `SKTextfield '${this.text}'`;
  }
}

export class SKNumberfield extends SKTextfield {
  constructor({ text = "", fill = "white", ...elementProps }: SKTextfieldProps = {}) {
    super(elementProps);
    this.padding = Style.textPadding;
    this.text = text;
    this.fill = fill;
  }

  protected _text = "";
  get text() {
    return this._text;
  }
  set text(t: string) {
    if (!isNaN(Number(t)))
      this._text = t;
    this.setMinimalSize(this.width, this.height);
  }

  protected applyEdit(text: string, key: string): string {
    if (key == "Backspace") {
      return text.slice(0, -1);
    } else if (key.length == 1 && !isNaN(Number(key))) {
      return text + key;
    } else return text;
  }

  public toString(): string {
    return `SKNumberfield '${this.text}'`;
  }
}
