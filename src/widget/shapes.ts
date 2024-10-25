import { insideHitTestRectangle, measureText } from "../utility";
import { SKElement, SKElementProps } from "./element";
import { Style } from "./style";
import { SKEvent, SKMouseEvent } from "../events";

import { requestMouseFocus } from "../dispatch";

export type SKShapeProps = SKElementProps & { text?: string };

export class SKShape extends SKElement {
  constructor({...elementProps }: SKShapeProps = {}) {
    super(elementProps);
    this.padding = Style.textPadding;
    this.calculateBasis();
    this.doLayout();
    this.width=10;
    this.height=10;
  }
  held: boolean = false;
  holdX: number = 0;
  holdY: number = 0;
  state: "idle" | "active" = "idle"; 
  corner: 1|2|3|4|0 = 0; 

  protected _lineWidth = 10;
  get lineWidth() {
    return this._lineWidth;
  }
  set lineWidth(w: number) {
    this._lineWidth = w;
  }

  protected _color = "black";
  get color() {
    return this._color;
  }
  set color(c: string) {
    this._color = c;
  }

  protected _cornerSize = 30;
  get cornerSize() {
    return this._cornerSize;
  }
  set cornerSize(n: number) {
    this._cornerSize = n;
  }

  handleMove(x:number, y:number, parentW:number, parentH:number){
    const w = this.width;
    const h = this.height;
    if (!this.held){
      
      this.held = true;
      this.holdX=x;
      this.holdY=y;
      
      let relativeX = x-this.x;
      let relativeY = y-this.y;
      this.corner = 0;
      const cw = this._cornerSize<Math.abs(w/3)? this._cornerSize*w/Math.abs(w): w/3;
      const ch = this._cornerSize<Math.abs(h/3)? this._cornerSize*h/Math.abs(h): h/3;
      if ((relativeX<cw&&w>0) || (relativeX>cw&&w<0)){
        if ((relativeY<ch&&h>0) || (relativeY>ch&&h<0)){
          this.corner=1;
        }
        else if ((relativeY>h-ch&&h>0)||(relativeY<h-ch&&h<0)){
          this.corner=2;
        }
      }
      else if ((relativeX>w-cw&&w>0)||(relativeX<w-cw&&w<0)){
        if ((relativeY<ch&&h>0) || (relativeY>ch&&h<0)){
          this.corner=3;
        }
        else if ((relativeY>h-ch&&h>0)||(relativeY<h-ch&&h<0)){
          this.corner=4;
        }
      }
      return;
    }
    switch (this.corner) {
      case 0:
        this.x-=this.holdX-x;
        this.y-=this.holdY-y;
        if (this.x<0)
          this.x=0;
        else if (this.x>parentW)
          this.x = parentW;
        else if (this.x+w>parentW)
          this.x=parentW-w;
        else if (this.x+w<0)
          this.x=-w;
        if (this.y<0)
          this.y=0;
        else if (this.y>parentH)
          this.y = parentH;
        else if (this.y+h>parentH)
          this.y=parentH-h;
        else if (this.y+h<0)
          this.y=-h;
        break;
    
      case 1:
        this.y-=this.holdY-y;
        this.x-=this.holdX-x;
        if (this.x<0){
          this.width+=this.holdX-x+this.x;
          this.x=0;
        }
        else if (this.x>parentW)
          this.x=parentW;
        else
          this.width+=this.holdX-x;

        if (this.y<0){
          this.height+=this.holdY-y+this.y;
          this.y=0;
        }
        else if (this.y>parentH)
          this.y=parentH;
        else
          this.height+=this.holdY-y;

        break;
        
      case 2:
        this.x-=this.holdX-x;
        if (this.x<0){
          this.width+=this.holdX-x+this.x;
          this.x=0;
        }
        else if (this.x>parentW)
          this.x=parentW;
        else
          this.width+=this.holdX-x;

        this.height-=this.holdY-y;
        if (this.y+this.height>parentH)
            this.height = parentH-this.y;
        else if (this.y+this.height<0)
            this.height = -this.y;
        break;

      case 3:
        this.y-=this.holdY-y;
        if (this.y<0){
          this.height+=this.holdY-y+this.y;
          this.y=0;
        }
        else if (this.y>parentH)
          this.y=parentH;
        else
          this.height+=this.holdY-y;

        this.width-=this.holdX-x;
        if (this.x+this.width>parentW)
            this.width = parentW-this.x;
        else if (this.x+this.width<0)
          this.width = -this.x;
        break;

      case 4:
        this.width-=this.holdX-x;
        if (this.x+this.width>parentW)
            this.width = parentW-this.x;
        else if (this.x+this.width<0)
          this.width = -this.x;

        this.height-=this.holdY-y;
        if (this.y+this.height>parentH)
            this.height = parentH-this.y;
        else if (this.y+this.height<0)
          this.height = -this.y;

        break;
    }
    this.holdX=x;
    this.holdY=y;
  }

  release(){
    this.held=false;
  }

  desel(){
    this.state="idle";
  }

  select(x:number, y:number): boolean{
    return false;
  }

  beginDraw(x:number, y:number){
    //this.state = "active";
    this.corner = 4;
    this.held = true;
    this.holdX = x;
    this.holdY = y;
  }

  handleMouseEvent(me: SKMouseEvent) {
    // I really wish I could use this method but:
      // When I was using this input handling, dragging the object too fast meant the mouse would leave the widget, and then input handling would stop.
      // The only way i could come up with to fix this was to handle the inputs externally.
      // Also, handling overlapping objects. if a shape is behind another one and the user tried to click on it, this function just won't register the click.
      // Handling inputs externally fixed this as well.
    return false;
  }

  draw(gc: CanvasRenderingContext2D) {
    // to save typing "this" so much
    
    gc.save();
    const w = this.width;
    const h = this.height;
    const cw = this._cornerSize<Math.abs(w/3)? this._cornerSize*w/Math.abs(w): w/3;
    const ch = this._cornerSize<Math.abs(h/3)? this._cornerSize*h/Math.abs(h): h/3;


    gc.translate(this.margin, this.margin);
    if (this.state == "active"){
      gc.beginPath();
      gc.rect(this.x, this.y, w, h);

      gc.rect(this.x, this.y, cw, ch);
      gc.rect(this.x+w-cw, this.y, cw, ch);
      gc.rect(this.x, this.y+h-ch, cw, ch);
      gc.rect(this.x+w-cw, this.y+h-ch, cw, ch);

      gc.strokeStyle = "black";
      gc.lineWidth = 1;
      gc.stroke();
    }
    gc.restore();

    // element draws debug viz if flag is set
    super.draw(gc);
  }

  public toString(): string {
    return `Shape`;
  } 
}


export class SKRect extends SKShape {
  constructor({...elementProps }: SKShapeProps = {}) {
    super(elementProps);
  }

  select(x:number, y:number): boolean{
    let w = Math.abs(this.width);
    let h = Math.abs(this.height);
    if (this.width>0)
      x = x-this.x;
    else
      x=x-this.x+w;
    
    if (this.height>0)
      y = y-this.y;
    else
      y=y-this.y+h;

    if (this.state == "idle"){
      if (x>=0 && x<=w &&
          y>=0 && y<=h &&
          !(
            x>=this._lineWidth && x<=w-this._lineWidth && 
            y>=this._lineWidth && y<=h-this._lineWidth
          )){
        if (y>=0 && y<=h){
          this.state = "active";
        }
      }
    }
    if (this.state == "active"){
      if (!(x>=0 && x<=w &&
        y>=0 && y<=h)){
          this.state = "idle";
          return false
      }
      return true;
    }
    this.state = "idle";
    return false;
  }

  draw(gc: CanvasRenderingContext2D) {
    gc.save();

    const w = this.width;
    const h = this.height;
    gc.translate(this.margin, this.margin);
    gc.beginPath();
    if (this._lineWidth<Math.abs(w)/2 && this._lineWidth<Math.abs(h)/2){
      let lw = this._lineWidth;
      let lh = this._lineWidth;
      if(w<0){
        lw = -this._lineWidth;
      }
      if(h<0){
        lh= -this._lineWidth;
      }
      gc.rect(this.x+lw/2, this.y+lh/2, w-lw, h-lh);
      gc.strokeStyle = this._color;
      gc.lineWidth = this._lineWidth;
      gc.stroke();
    }
    else{
      gc.rect(this.x, this.y, w, h);
      gc.fillStyle = this._color;
      gc.fill();
    }
    gc.restore();
    super.draw(gc);
  }
}

export class SKCirc extends SKShape {
  constructor({...elementProps }: SKShapeProps = {}) {
    super(elementProps);
  }

  select(x:number, y:number): boolean{
    x = x-(this.x+this.width/2);
    y = y-(this.y+this.height/2);
    let w = Math.abs(this.width);
    let h = Math.abs(this.height);
    let a = w/2;
    let b = h/2;
    let outerEllipse = Math.sqrt(b**2 * (1-(x**2/a**2)));
    let innerEllipse = Math.sqrt((b-this._lineWidth)**2 * (1-(x**2/(a-this._lineWidth)**2)));
    if (this.state == "idle"){
      if (y<=outerEllipse && y >= -outerEllipse &&
          x>=-w/2 && x<=w/2 &&
          (!(y<=innerEllipse && y >= -innerEllipse)||(this._lineWidth>w/2 && this._lineWidth>h/2))
        ){
          this.state = "active";
        
      }
    }
    if (this.state == "active"){
      if (!(x>=-w/2 && x<=w/2 &&
        y>=-h/2 && y<=h/2)){
          this.state = "idle";
          return false
      }
      return true;
    }
    this.state = "idle";
    return false;
  }

  draw(gc: CanvasRenderingContext2D) {
    gc.save();

    let w;
    let h;
    let y;
    let x;
    if (this.width>=0){
      w = this.width;
      x = this.x;
    }
    else{
      w = -this.width;
      x = this.x+this.width;

    }

    if (this.height>=0){
      h = this.height;
      y = this.y;
    }
    else{
      h = -this.height;
      y = this.y+this.height;
    }

    gc.translate(this.margin, this.margin);
    gc.beginPath();
    
    if (this._lineWidth<w/2 && this._lineWidth<h/2){
      gc.ellipse(x+w/2, y+h/2, w/2-this._lineWidth/2, h/2-this._lineWidth/2, 0, 0, 2 * Math.PI);
      gc.strokeStyle = this._color;
      gc.lineWidth = this._lineWidth;
      gc.stroke();
    }
    else{
      gc.ellipse(x+w/2, y+h/2, w/2, h/2, 0, 0, 2 * Math.PI);
      gc.fillStyle = this._color;
      gc.fill();
    }
    gc.restore();
    super.draw(gc);
  }
}

export class SKLine extends SKShape {
  constructor({...elementProps }: SKShapeProps = {}) {
    super(elementProps);
  }

  select(x:number, y:number): boolean{
    let w = Math.abs(this.width);
    let h = Math.abs(this.height);
    let m = h/w;
    if (this.width>0)
      x = x-this.x;
    else{
      x=x-this.x+w;
      m=-m;
    }
    
    if (this.height>0)
      y = y-this.y;
    else{
      y=y-this.y+h;
      m=-m;
    }
    let topLineY;
    let bottomLineY;
    if (m<0){
      topLineY = m*x + h - (this._lineWidth/2 * Math.sqrt((m**2)+1))
      bottomLineY= m*x + h + (this._lineWidth/2 * Math.sqrt((m**2)+1))
    }
    else{
      topLineY = m*x - (this._lineWidth/2 * Math.sqrt((m**2)+1))
      bottomLineY= m*x + (this._lineWidth/2 * Math.sqrt((m**2)+1))
    }
    
    if (this.state == "idle"){
      if (y>=topLineY && y <= bottomLineY &&
          x>=0 && x<=w &&
          y>=0 && y<=h
        ){
          this.state = "active";
        
      }
    }
    if (this.state == "active"){
      if (!(x>=0 && x<=w &&
        y>=0 && y<=h)){
          this.state = "idle";
          return false
      }
      return true;
    }
    this.state = "idle";
    return false;
  }

  draw(gc: CanvasRenderingContext2D) {
    gc.save();

    const w = this.width;
    const h = this.height;
    gc.translate(this.margin, this.margin);
    gc.beginPath();
    gc.moveTo(this.x, this.y)
    gc.lineTo(this.x+w, this.y+h);
    gc.strokeStyle = this._color;
    gc.lineWidth = this._lineWidth;
    gc.stroke();
    gc.restore();
    super.draw(gc);
  }
}