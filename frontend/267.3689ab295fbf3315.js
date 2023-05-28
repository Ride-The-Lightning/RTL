"use strict";(self.webpackChunkRTLApp=self.webpackChunkRTLApp||[]).push([[267],{1203:(Q,w,i)=>{i.d(w,{D:()=>O});var a=i(7579),T=i(2722),d=i(7731),e=i(8377),t=i(4650),A=i(62),D=i(9653),F=i(6895),x=i(1576),c=i(7392),U=i(266),N=i(3848);function y(p,g){if(1&p&&(t.TgZ(0,"mat-icon",10),t._uU(1,"info_outline"),t.qZA()),2&p){const u=t.oxw().$implicit;t.Q6J("matTooltip",u.tooltip)}}function L(p,g){if(1&p&&(t.TgZ(0,"span",11),t._uU(1),t.ALo(2,"number"),t.qZA()),2&p){const u=t.oxw().$implicit;t.xp6(1),t.hij(" ",t.lcZ(2,1,u.dataValue)," ")}}function E(p,g){if(1&p&&(t.TgZ(0,"span",11),t._uU(1),t.ALo(2,"number"),t.qZA()),2&p){const u=t.oxw().$implicit,l=t.oxw(2);t.xp6(1),t.hij(" ",t.xi3(2,1,u[l.currencyUnitEnum.BTC],l.currencyUnitFormats.BTC)," ")}}function S(p,g){if(1&p&&(t.TgZ(0,"span",11),t._uU(1),t.ALo(2,"number"),t.qZA()),2&p){const u=t.oxw().$implicit,l=t.oxw(2);t.xp6(1),t.hij(" ",t.xi3(2,1,u[l.currencyUnitEnum.OTHER],l.currencyUnitFormats.OTHER)," ")}}function k(p,g){if(1&p&&(t.TgZ(0,"div",6)(1,"div",7),t._uU(2),t.YNc(3,y,2,1,"mat-icon",8),t.qZA(),t.YNc(4,L,3,3,"span",9),t.YNc(5,E,3,4,"span",9),t.YNc(6,S,3,4,"span",9),t.qZA()),2&p){const u=g.$implicit,l=t.oxw().$implicit,_=t.oxw();t.xp6(2),t.hij(" ",u.title," "),t.xp6(1),t.Q6J("ngIf",u.tooltip),t.xp6(1),t.Q6J("ngIf",l===_.currencyUnitEnum.SATS),t.xp6(1),t.Q6J("ngIf",l===_.currencyUnitEnum.BTC),t.xp6(1),t.Q6J("ngIf",_.fiatConversion&&l!==_.currencyUnitEnum.SATS&&l!==_.currencyUnitEnum.BTC&&""===_.conversionErrorMsg)}}function b(p,g){if(1&p&&(t.TgZ(0,"div",12)(1,"div",13),t._uU(2),t.qZA()()),2&p){const u=t.oxw(2);t.xp6(2),t.Oqu(u.conversionErrorMsg)}}function R(p,g){if(1&p&&(t.TgZ(0,"mat-tab",2)(1,"div",3),t.YNc(2,k,7,5,"div",4),t.qZA(),t.YNc(3,b,3,1,"div",5),t.qZA()),2&p){const u=g.$implicit,l=t.oxw();t.s9C("label",u),t.xp6(2),t.Q6J("ngForOf",l.values),t.xp6(1),t.Q6J("ngIf",l.fiatConversion&&u!==l.currencyUnitEnum.SATS&&u!==l.currencyUnitEnum.BTC&&""!==l.conversionErrorMsg)}}let O=(()=>{class p{constructor(u,l){this.commonService=u,this.store=l,this.values=[],this.currencyUnitEnum=d.NT,this.currencyUnitFormats=d.Xz,this.currencyUnits=[],this.fiatConversion=!1,this.conversionErrorMsg="",this.unSubs=[new a.x,new a.x,new a.x]}ngOnInit(){this.store.select(e.dT).pipe((0,T.R)(this.unSubs[0])).subscribe(u=>{this.fiatConversion=u.settings.fiatConversion,this.currencyUnits=u.settings.currencyUnits,this.fiatConversion||this.currencyUnits.splice(2,1),this.currencyUnits.length>1&&this.values[0]&&this.values[0].dataValue>=0&&this.getCurrencyValues(this.values)})}ngOnChanges(){this.currencyUnits.length>1&&this.values[0]&&this.values[0].dataValue>=0&&this.getCurrencyValues(this.values)}getCurrencyValues(u){u.forEach(l=>{l.dataValue>0?(this.commonService.convertCurrency(l.dataValue,d.NT.SATS,d.NT.BTC,"",!0).pipe((0,T.R)(this.unSubs[1])).subscribe(_=>{l[d.NT.BTC]=_.BTC}),this.commonService.convertCurrency(l.dataValue,d.NT.SATS,d.NT.OTHER,this.currencyUnits[2],this.fiatConversion).pipe((0,T.R)(this.unSubs[2])).subscribe({next:_=>{l[d.NT.OTHER]=_.OTHER},error:_=>{this.conversionErrorMsg="Conversion Error: "+_}})):(l[d.NT.BTC]=l.dataValue,""===this.conversionErrorMsg&&(l[d.NT.OTHER]=l.dataValue))})}ngOnDestroy(){this.unSubs.forEach(u=>{u.next(null),u.complete()})}}return p.\u0275fac=function(u){return new(u||p)(t.Y36(A.v),t.Y36(D.yh))},p.\u0275cmp=t.Xpm({type:p,selectors:[["rtl-currency-unit-converter"]],inputs:{values:"values"},features:[t.TTD],decls:2,vars:1,consts:[["mat-stretch-tabs","false","mat-align-tabs","start"],[3,"label",4,"ngFor","ngForOf"],[3,"label"],["fxLayout","row","fxFlex","100","fxLayoutAlign","start start"],["fxLayout","column","fxLayoutAlign","center start","class","cc-data-block",4,"ngFor","ngForOf"],["fxLayout","row","fxFlex","100","class","p-1 error-border mt-1",4,"ngIf"],["fxLayout","column","fxLayoutAlign","center start",1,"cc-data-block"],["fxLayout","row","fxFlex","100","fxLayoutAlign","start start",1,"cc-data-title"],["matTooltipPosition","below","class","info-icon",3,"matTooltip",4,"ngIf"],["class","cc-data-value",4,"ngIf"],["matTooltipPosition","below",1,"info-icon",3,"matTooltip"],[1,"cc-data-value"],["fxLayout","row","fxFlex","100",1,"p-1","error-border","mt-1"],[1,"cc-data-block"]],template:function(u,l){1&u&&(t.TgZ(0,"mat-tab-group",0),t.YNc(1,R,4,3,"mat-tab",1),t.qZA()),2&u&&(t.xp6(1),t.Q6J("ngForOf",l.currencyUnits))},dependencies:[F.sg,F.O5,x.xw,x.Wh,x.yH,c.Hw,U.gM,N.uX,N.SP,F.JJ]}),p})()},9122:(Q,w,i)=>{i.d(w,{n:()=>u});var a=i(5412),T=i(2687),d=i(7731),e=i(4650),t=i(5043),A=i(62),D=i(7009),F=i(6895),x=i(2216),c=i(1576),U=i(5829),N=i(4859),y=i(3546),L=i(4850),E=i(658),S=i(5199),k=i(3390);const b=function(l){return{"display-none":l}};function R(l,_){if(1&l&&(e.TgZ(0,"div",20),e._UZ(1,"qr-code",21),e.qZA()),2&l){const h=e.oxw();e.Q6J("ngClass",e.VKq(4,b,h.screenSize===h.screenSizeEnum.XS||h.screenSize===h.screenSizeEnum.SM)),e.xp6(1),e.Q6J("value",h.address)("size",h.qrWidth)("errorCorrectionLevel","L")}}function O(l,_){if(1&l&&(e.TgZ(0,"div",22),e._UZ(1,"qr-code",21),e.qZA()),2&l){const h=e.oxw();e.Q6J("ngClass",e.VKq(4,b,h.screenSize!==h.screenSizeEnum.XS&&h.screenSize!==h.screenSizeEnum.SM)),e.xp6(1),e.Q6J("value",h.address)("size",h.qrWidth)("errorCorrectionLevel","L")}}function p(l,_){if(1&l&&(e.TgZ(0,"div",13)(1,"div",14)(2,"h4",15),e._uU(3,"Address Type"),e.qZA(),e.TgZ(4,"span",23),e._uU(5),e.qZA()()()),2&l){const h=e.oxw();e.xp6(5),e.Oqu(h.addressType)}}function g(l,_){1&l&&e._UZ(0,"mat-divider",17)}let u=(()=>{class l{constructor(h,V,B,Z,Y){this.dialogRef=h,this.data=V,this.logger=B,this.commonService=Z,this.snackBar=Y,this.faReceipt=T.dLy,this.address="",this.addressType="",this.qrWidth=230,this.screenSize="",this.screenSizeEnum=d.cu}ngOnInit(){this.address=this.data.address,this.addressType=this.data.addressType,this.screenSize=this.commonService.getScreenSize()}onClose(){this.dialogRef.close(!1)}onCopyAddress(h){this.snackBar.open("Generated address copied."),this.logger.info("Copied Text: "+h)}}return l.\u0275fac=function(h){return new(h||l)(e.Y36(a.so),e.Y36(a.WI),e.Y36(t.mQ),e.Y36(A.v),e.Y36(D.ux))},l.\u0275cmp=e.Xpm({type:l,selectors:[["rtl-on-chain-generated-address"]],decls:25,vars:8,consts:[["fxLayout","column","fxLayout.gt-sm","row","fxLayoutAlign","space-between stretch"],["fxFlex","35","fxLayoutAlign","center start","class","modal-qr-code-container padding-gap-large",3,"ngClass",4,"ngIf"],["fxFlex","65"],["fxLayout","row","fxLayoutAlign","space-between center",1,"modal-info-header"],["fxFlex","95","fxLayoutAlign","start start"],[1,"page-title-img","mr-1",3,"icon"],[1,"page-title"],["tabindex","2","fxFlex","5","fxLayoutAlign","center center","mat-button","",1,"btn-close-x","p-0",3,"click"],[1,"padding-gap-x-large"],["fxLayout","column"],["fxFlex","50","fxLayoutAlign","center start","class","modal-qr-code-container padding-gap-large",3,"ngClass",4,"ngIf"],["fxLayout","row",4,"ngIf"],["class","w-100 my-1",4,"ngIf"],["fxLayout","row"],["fxFlex","100"],["fxLayoutAlign","start",1,"font-bold-500"],[1,"overflow-wrap","foreground-secondary-text"],[1,"w-100","my-1"],["fxLayout","row","fxLayoutAlign","end center",1,"mt-1"],["autoFocus","","mat-button","","color","primary","tabindex","1","type","submit","rtlClipboard","",3,"payload","copied"],["fxFlex","35","fxLayoutAlign","center start",1,"modal-qr-code-container","padding-gap-large",3,"ngClass"],[3,"value","size","errorCorrectionLevel"],["fxFlex","50","fxLayoutAlign","center start",1,"modal-qr-code-container","padding-gap-large",3,"ngClass"],[1,"foreground-secondary-text"]],template:function(h,V){1&h&&(e.TgZ(0,"div",0),e.YNc(1,R,2,6,"div",1),e.TgZ(2,"div",2)(3,"mat-card-header",3)(4,"div",4),e._UZ(5,"fa-icon",5),e.TgZ(6,"span",6),e._uU(7),e.qZA()(),e.TgZ(8,"button",7),e.NdJ("click",function(){return V.onClose()}),e._uU(9,"X"),e.qZA()(),e.TgZ(10,"mat-card-content",8)(11,"div",9),e.YNc(12,O,2,6,"div",10),e.YNc(13,p,6,1,"div",11),e.YNc(14,g,1,0,"mat-divider",12),e.TgZ(15,"div",13)(16,"div",14)(17,"h4",15),e._uU(18,"Address"),e.qZA(),e.TgZ(19,"span",16),e._uU(20),e.qZA()()(),e._UZ(21,"mat-divider",17),e.TgZ(22,"div",18)(23,"button",19),e.NdJ("copied",function(Z){return V.onCopyAddress(Z)}),e._uU(24,"Copy Address"),e.qZA()()()()()()),2&h&&(e.xp6(1),e.Q6J("ngIf",V.address),e.xp6(4),e.Q6J("icon",V.faReceipt),e.xp6(2),e.Oqu(V.screenSize===V.screenSizeEnum.XS?"Address":"Generated Address"),e.xp6(5),e.Q6J("ngIf",V.address),e.xp6(1),e.Q6J("ngIf",""!==V.addressType),e.xp6(1),e.Q6J("ngIf",""!==V.addressType),e.xp6(6),e.Oqu(V.address),e.xp6(3),e.Q6J("payload",V.address))},dependencies:[F.mk,F.O5,x.BN,c.xw,c.Wh,c.yH,U.oO,N.lW,y.dn,y.dk,L.d,E.uU,S.y,k.h]}),l})()},7671:(Q,w,i)=>{i.d(w,{D:()=>K});var a=i(4650),T=i(113),d=i(7731),e=i(5043),t=i(6895),A=i(4006),D=i(1576),F=i(4859),x=i(9602),c=i(7392),U=i(4144),N=i(9549),y=i(4385),L=i(3238),E=i(3353);let S=(()=>{class o extends L.LF{constructor(r,m){super(r,m)}format(r,m){return"MMM YYYY"===m?d.gg[r.getMonth()].name+", "+r.getFullYear():"YYYY"===m?r.getFullYear().toString():r.getDate()+"/"+d.gg[r.getMonth()].name+"/"+r.getFullYear()}}return o.\u0275fac=function(r){return new(r||o)(a.LFG(L.Ad,8),a.LFG(E.t4))},o.\u0275prov=a.Yz7({token:o,factory:o.\u0275fac}),o})();const k={parse:{dateInput:"LL"},display:{dateInput:"MMM YYYY",monthYearLabel:"YYYY",dateA11yLabel:"LL",monthYearA11yLabel:"YYYY"}},b={parse:{dateInput:"LL"},display:{dateInput:"YYYY",monthYearLabel:"YYYY",dateA11yLabel:"LL",monthYearA11yLabel:"YYYY"}};let R=(()=>{class o{}return o.\u0275fac=function(r){return new(r||o)},o.\u0275dir=a.lG2({type:o,selectors:[["","monthlyDate",""]],features:[a._Bn([{provide:L._A,useClass:S},{provide:L.sG,useValue:k}])]}),o})(),O=(()=>{class o{}return o.\u0275fac=function(r){return new(r||o)},o.\u0275dir=a.lG2({type:o,selectors:[["","yearlyDate",""]],features:[a._Bn([{provide:L._A,useClass:S},{provide:L.sG,useValue:b}])]}),o})();var p=i(9843),g=i(6534);const u=["monthlyDatepicker"],l=["yearlyDatepicker"],_=function(){return{animationDirection:"forward"}};function h(o,H){if(1&o&&a.GkF(0,9),2&o){a.oxw();const r=a.MAs(19);a.Q6J("ngTemplateOutlet",r)("ngTemplateOutletContext",a.DdM(2,_))}}const V=function(){return{animationDirection:"backward"}};function B(o,H){if(1&o&&a.GkF(0,9),2&o){a.oxw();const r=a.MAs(19);a.Q6J("ngTemplateOutlet",r)("ngTemplateOutletContext",a.DdM(2,V))}}const Z=function(){return{animationDirection:""}};function Y(o,H){if(1&o&&a.GkF(0,9),2&o){a.oxw();const r=a.MAs(19);a.Q6J("ngTemplateOutlet",r)("ngTemplateOutletContext",a.DdM(2,Z))}}function G(o,H){if(1&o&&(a.TgZ(0,"mat-option",17),a._uU(1),a.ALo(2,"titlecase"),a.qZA()),2&o){const r=H.$implicit;a.Q6J("value",r),a.xp6(1),a.hij(" ",a.lcZ(2,2,r)," ")}}function I(o,H){if(1&o){const r=a.EpF();a.TgZ(0,"mat-form-field",18)(1,"input",19,20),a.NdJ("ngModelChange",function(z){a.CHM(r);const M=a.oxw(2);return a.KtG(M.selectedValue=z)}),a.qZA(),a._UZ(3,"mat-datepicker-toggle",21),a.TgZ(4,"mat-datepicker",22,23),a.NdJ("monthSelected",function(z){a.CHM(r);const M=a.oxw(2);return a.KtG(M.onMonthSelected(z))})("dateSelected",function(z){a.CHM(r);const M=a.oxw(2);return a.KtG(M.onMonthSelected(z))}),a.qZA()()}if(2&o){const r=a.MAs(5),m=a.oxw(2);a.xp6(1),a.Q6J("matDatepicker",r)("min",m.first)("max",m.last)("ngModel",m.selectedValue),a.xp6(2),a.Q6J("for",r),a.xp6(1),a.Q6J("startAt",m.selectedValue)}}function W(o,H){if(1&o){const r=a.EpF();a.TgZ(0,"mat-form-field",24)(1,"input",25,26),a.NdJ("ngModelChange",function(z){a.CHM(r);const M=a.oxw(2);return a.KtG(M.selectedValue=z)}),a.qZA(),a._UZ(3,"mat-datepicker-toggle",21),a.TgZ(4,"mat-datepicker",27,28),a.NdJ("yearSelected",function(z){a.CHM(r);const M=a.oxw(2);return a.KtG(M.onYearSelected(z))})("monthSelected",function(z){a.CHM(r);const M=a.oxw(2);return a.KtG(M.onYearSelected(z))})("dateSelected",function(z){a.CHM(r);const M=a.oxw(2);return a.KtG(M.onYearSelected(z))}),a.qZA()()}if(2&o){const r=a.MAs(5),m=a.oxw(2);a.xp6(1),a.Q6J("matDatepicker",r)("min",m.first)("max",m.last)("ngModel",m.selectedValue),a.xp6(2),a.Q6J("for",r),a.xp6(1),a.Q6J("startAt",m.selectedValue)}}function q(o,H){if(1&o){const r=a.EpF();a.TgZ(0,"div",10)(1,"div",11)(2,"mat-select",12),a.NdJ("ngModelChange",function(z){a.CHM(r);const M=a.oxw();return a.KtG(M.selScrollRange=z)})("selectionChange",function(z){a.CHM(r);const M=a.oxw();return a.KtG(M.onRangeChanged(z))}),a.YNc(3,G,3,4,"mat-option",13),a.qZA()(),a.TgZ(4,"div",14),a.YNc(5,I,6,6,"mat-form-field",15),a.YNc(6,W,6,6,"mat-form-field",16),a.qZA()()}if(2&o){const r=a.oxw();a.Q6J("@sliderAnimation",r.animationDirection),a.xp6(2),a.Q6J("ngModel",r.selScrollRange),a.xp6(1),a.Q6J("ngForOf",r.scrollRanges),a.xp6(2),a.Q6J("ngIf",r.selScrollRange===r.scrollRanges[0]),a.xp6(1),a.Q6J("ngIf",r.selScrollRange===r.scrollRanges[1])}}let K=(()=>{class o{constructor(r){this.logger=r,this.scrollRanges=d.op,this.selScrollRange=this.scrollRanges[0],this.today=new Date(Date.now()),this.first=new Date(2018,0,1,0,0,0),this.last=new Date(this.today.getFullYear(),this.today.getMonth(),this.today.getDate(),0,0,0),this.disablePrev=!1,this.disableNext=!0,this.animationDirection="",this.selectedValue=this.last,this.stepChanged=new a.vpe}onRangeChanged(r){this.selScrollRange=r.value,this.onStepChange("LAST")}onMonthSelected(r){this.selectedValue=r,this.onStepChange("SELECTED"),this.monthlyDatepicker.close()}onYearSelected(r){this.selectedValue=r,this.onStepChange("SELECTED"),this.yearlyDatepicker.close()}onStepChange(r){switch(this.logger.info(r),r){case"FIRST":this.animationDirection="backward",this.selectedValue!==this.first&&(this.selectedValue=this.first,this.stepChanged.emit({selDate:this.selectedValue,selScrollRange:this.selScrollRange}));break;case"PREVIOUS":this.selectedValue=this.selScrollRange===d.op[1]?new Date(this.selectedValue.getFullYear()-1,0,1,0,0,0):new Date(this.selectedValue.getFullYear(),this.selectedValue.getMonth()-1,1,0,0,0),this.animationDirection="backward",this.stepChanged.emit({selDate:this.selectedValue,selScrollRange:this.selScrollRange});break;case"NEXT":this.selectedValue=this.selScrollRange===d.op[1]?new Date(this.selectedValue.getFullYear()+1,0,1,0,0,0):new Date(this.selectedValue.getFullYear(),this.selectedValue.getMonth()+1,1,0,0,0),this.animationDirection="forward",this.stepChanged.emit({selDate:this.selectedValue,selScrollRange:this.selScrollRange});break;case"LAST":this.animationDirection="forward",this.selectedValue=this.last,this.stepChanged.emit({selDate:this.selectedValue,selScrollRange:this.selScrollRange});break;default:this.animationDirection="",this.stepChanged.emit({selDate:this.selectedValue,selScrollRange:this.selScrollRange})}this.disablePrev=this.selScrollRange===d.op[1]?this.selectedValue.getFullYear()<=this.first.getFullYear():this.selectedValue.getFullYear()<=this.first.getFullYear()&&this.selectedValue.getMonth()<=this.first.getMonth(),this.disableNext=this.selScrollRange===d.op[1]?this.selectedValue.getFullYear()>=this.last.getFullYear():this.selectedValue.getFullYear()>=this.last.getFullYear()&&this.selectedValue.getMonth()>=this.last.getMonth(),this.logger.info(this.disablePrev),this.logger.info(this.disableNext),setTimeout(()=>{this.animationDirection=""},800)}onChartMouseUp(r){"monthlyDate"===r.srcElement.name?this.monthlyDatepicker.open():"yearlyDate"===r.srcElement.name&&this.yearlyDatepicker.open()}}return o.\u0275fac=function(r){return new(r||o)(a.Y36(e.mQ))},o.\u0275cmp=a.Xpm({type:o,selectors:[["rtl-horizontal-scroller"]],viewQuery:function(r,m){if(1&r&&(a.Gf(u,5),a.Gf(l,5)),2&r){let z;a.iGM(z=a.CRH())&&(m.monthlyDatepicker=z.first),a.iGM(z=a.CRH())&&(m.yearlyDatepicker=z.first)}},hostBindings:function(r,m){1&r&&a.NdJ("click",function(M){return m.onChartMouseUp(M)})},outputs:{stepChanged:"stepChanged"},decls:20,vars:5,consts:[["fxLayout","row","fxLayoutAlign","space-between stretch","fxFlex","100",1,"padding-gap-x"],["fxLayout","row","fxLayoutAlign","start center","fxFlex","20"],["mat-icon-button","","color","primary","type","button","tabindex","1",1,"pr-4",3,"click"],["mat-icon-button","","color","primary","type","button","tabindex","2",3,"disabled","click"],[3,"ngTemplateOutlet","ngTemplateOutletContext",4,"ngIf"],["fxLayout","row","fxLayoutAlign","end center","fxFlex","20"],["mat-icon-button","","color","primary","type","button","tabindex","5",1,"pr-4",3,"disabled","click"],["mat-icon-button","","color","primary","type","button","tabindex","6",3,"click"],["controlsPanel",""],[3,"ngTemplateOutlet","ngTemplateOutletContext"],["fxLayout","row","fxLayoutAlign","center center","fxFlex","58"],["fxFlex","50","fxLayoutAlign","center center","fxLayoutAlign.gt-xs","end center",1,"font-bold-700"],["fxFlex","60","fxFlex.gt-md","30","name","selScrlRange","tabindex","3",1,"font-bold-700",3,"ngModel","ngModelChange","selectionChange"],[3,"value",4,"ngFor","ngForOf"],["fxFlex","50","fxLayout","row","fxLayoutAlign","center center","fxLayoutAlign.gt-xs","start center"],["monthlyDate","","fxLayoutAlign","center center",4,"ngIf"],["yearlyDate","","fxLayoutAlign","center center",4,"ngIf"],[3,"value"],["monthlyDate","","fxLayoutAlign","center center"],["matInput","","name","monthlyDate","tabindex","4","readonly","",3,"matDatepicker","min","max","ngModel","ngModelChange"],["monthlyDt","ngModel"],["matSuffix","",3,"for"],["startView","year",3,"startAt","monthSelected","dateSelected"],["monthlyDatepicker",""],["yearlyDate","","fxLayoutAlign","center center"],["matInput","","name","yearlyDate","tabindex","4","readonly","",3,"matDatepicker","min","max","ngModel","ngModelChange"],["yearlyDt","ngModel"],["startView","multi-year",3,"startAt","yearSelected","monthSelected","dateSelected"],["yearlyDatepicker",""]],template:function(r,m){1&r&&(a.TgZ(0,"div",0)(1,"div",1)(2,"button",2),a.NdJ("click",function(){return m.onStepChange("FIRST")}),a.TgZ(3,"mat-icon"),a._uU(4,"skip_previous"),a.qZA()(),a.TgZ(5,"button",3),a.NdJ("click",function(){return m.onStepChange("PREVIOUS")}),a.TgZ(6,"mat-icon"),a._uU(7,"navigate_before"),a.qZA()()(),a.YNc(8,h,1,3,"ng-container",4),a.YNc(9,B,1,3,"ng-container",4),a.YNc(10,Y,1,3,"ng-container",4),a.TgZ(11,"div",5)(12,"button",6),a.NdJ("click",function(){return m.onStepChange("NEXT")}),a.TgZ(13,"mat-icon"),a._uU(14,"navigate_next"),a.qZA()(),a.TgZ(15,"button",7),a.NdJ("click",function(){return m.onStepChange("LAST")}),a.TgZ(16,"mat-icon"),a._uU(17,"skip_next"),a.qZA()()()(),a.YNc(18,q,7,5,"ng-template",null,8,a.W1O)),2&r&&(a.xp6(5),a.Q6J("disabled",m.disablePrev),a.xp6(3),a.Q6J("ngIf","forward"===m.animationDirection),a.xp6(1),a.Q6J("ngIf","backward"===m.animationDirection),a.xp6(1),a.Q6J("ngIf",""===m.animationDirection),a.xp6(2),a.Q6J("disabled",m.disableNext))},dependencies:[t.sg,t.O5,t.tP,A.Fj,A.JJ,A.On,D.xw,D.Wh,D.yH,F.RK,x.Mq,x.hl,x.nW,c.Hw,U.Nt,N.KE,N.R9,y.gD,L.ey,R,O,p.F,g.q,t.rS],data:{animation:[T.l]}}),o})()},165:(Q,w,i)=>{i.d(w,{g:()=>$});var a=i(8739),T=i(6308),d=i(671),e=i(7731),t=i(7861),A=i(7579),D=i(2722),F=i(8377),x=i(4385),c=i(4650),U=i(62),N=i(9653),y=i(6895),L=i(9445),E=i(4006),S=i(1576),k=i(5829),b=i(4859),R=i(4144),O=i(9549),p=i(3238),g=i(6839);function u(s,C){if(1&s&&(c.TgZ(0,"mat-option",30),c._uU(1),c.qZA()),2&s){const n=C.$implicit,f=c.oxw();c.Q6J("value",n),c.xp6(1),c.Oqu(f.getLabel(n))}}function l(s,C){1&s&&(c.TgZ(0,"th",31),c._uU(1,"Date"),c.qZA())}function _(s,C){if(1&s&&(c.TgZ(0,"td",32),c._uU(1),c.ALo(2,"date"),c.qZA()),2&s){const n=C.$implicit,f=c.oxw();c.xp6(1),c.Oqu(c.xi3(2,1,null==n?null:n.date,f.dataRange===f.scrollRanges[1]?"MMM/yyyy":"dd/MMM/yyyy"))}}function h(s,C){1&s&&(c.TgZ(0,"th",33),c._uU(1,"Amount Paid (Sats)"),c.qZA())}function V(s,C){if(1&s&&(c.TgZ(0,"td",32)(1,"span",34),c._uU(2),c.ALo(3,"number"),c.qZA()()),2&s){const n=C.$implicit;c.xp6(2),c.Oqu(c.xi3(3,1,null==n?null:n.amount_paid,"1.0-2"))}}function B(s,C){1&s&&(c.TgZ(0,"th",33),c._uU(1,"# Payments"),c.qZA())}function Z(s,C){if(1&s&&(c.TgZ(0,"td",32)(1,"span",34),c._uU(2),c.ALo(3,"number"),c.qZA()()),2&s){const n=C.$implicit;c.xp6(2),c.Oqu(c.lcZ(3,1,null==n?null:n.num_payments))}}function Y(s,C){1&s&&(c.TgZ(0,"th",33),c._uU(1,"Amount Received (Sats)"),c.qZA())}function G(s,C){if(1&s&&(c.TgZ(0,"td",32)(1,"span",34),c._uU(2),c.ALo(3,"number"),c.qZA()()),2&s){const n=C.$implicit;c.xp6(2),c.Oqu(c.xi3(3,1,null==n?null:n.amount_received,"1.0-2"))}}function I(s,C){1&s&&(c.TgZ(0,"th",33),c._uU(1,"# Invoices"),c.qZA())}function W(s,C){if(1&s&&(c.TgZ(0,"td",32)(1,"span",34),c._uU(2),c.ALo(3,"number"),c.qZA()()),2&s){const n=C.$implicit;c.xp6(2),c.Oqu(c.lcZ(3,1,null==n?null:n.num_invoices))}}function q(s,C){if(1&s){const n=c.EpF();c.TgZ(0,"th",35)(1,"div",36)(2,"mat-select",37),c._UZ(3,"mat-select-trigger"),c.TgZ(4,"mat-option",38),c.NdJ("click",function(){c.CHM(n);const v=c.oxw();return c.KtG(v.onDownloadCSV())}),c._uU(5,"Download CSV"),c.qZA()()()()}}function K(s,C){if(1&s){const n=c.EpF();c.TgZ(0,"td",39)(1,"button",40),c.NdJ("click",function(){const P=c.CHM(n).$implicit,c2=c.oxw();return c.KtG(c2.onTransactionClick(P))}),c._uU(2,"View Info"),c.qZA()()}}function o(s,C){1&s&&(c.TgZ(0,"p"),c._uU(1,"No transaction available."),c.qZA())}function H(s,C){if(1&s&&(c.TgZ(0,"td",41),c.YNc(1,o,2,0,"p",42),c.qZA()),2&s){const n=c.oxw();c.xp6(1),c.Q6J("ngIf",!(null!=n.transactions&&n.transactions.data)||(null==n.transactions||null==n.transactions.data?null:n.transactions.data.length)<1)}}const r=function(s){return{"display-none":s}};function m(s,C){if(1&s&&c._UZ(0,"tr",43),2&s){const n=c.oxw();c.Q6J("ngClass",c.VKq(1,r,(null==n.transactions?null:n.transactions.data)&&(null==n.transactions||null==n.transactions.data?null:n.transactions.data.length)>0))}}function z(s,C){1&s&&c._UZ(0,"tr",44)}function M(s,C){1&s&&c._UZ(0,"tr",45)}const J=function(){return["all"]},j=function(){return["no_transaction"]};let $=(()=>{class s{constructor(n,f,v,P){this.commonService=n,this.store=f,this.datePipe=v,this.camelCaseWithReplace=P,this.dataRange=e.op[0],this.dataList=[],this.selFilter="",this.displayedColumns=["date","amount_paid","num_payments","amount_received","num_invoices"],this.tableSetting={tableId:"transactions",recordsPerPage:e.IV,sortBy:"date",sortOrder:e.Pi.DESCENDING},this.nodePageDefs=e.hG,this.selFilterBy="all",this.timezoneOffset=60*new Date(Date.now()).getTimezoneOffset(),this.scrollRanges=e.op,this.transactions=new d.by([]),this.pageSize=e.IV,this.pageSizeOptions=e.TJ,this.screenSize="",this.screenSizeEnum=e.cu,this.unSubs=[new A.x,new A.x],this.screenSize=this.commonService.getScreenSize()}ngOnInit(){this.store.select(F.dT).pipe((0,D.R)(this.unSubs[0])).subscribe(n=>{this.nodePageDefs="CLN"===n.lnImplementation?e.At:"ECL"===n.lnImplementation?e.Xk:e.hG}),this.pageSize=this.tableSetting.recordsPerPage?+this.tableSetting.recordsPerPage:e.IV,this.dataList&&this.dataList.length>0&&this.loadTransactionsTable(this.dataList)}ngAfterViewInit(){setTimeout(()=>{this.setTableWidgets()},0)}ngOnChanges(n){n.dataList&&!n.dataList.firstChange&&(this.pageSize=this.tableSetting.recordsPerPage?+this.tableSetting.recordsPerPage:e.IV,this.loadTransactionsTable(this.dataList)),n.selFilter&&!n.selFilter.firstChange&&(this.selFilterBy="all",this.applyFilter())}onTransactionClick(n){const f=[[{key:"date",value:this.datePipe.transform(n.date,this.dataRange===e.op[1]?"MMM/yyyy":"dd/MMM/yyyy"),title:"Date",width:100,type:e.Gi.DATE}],[{key:"amount_paid",value:Math.round(n.amount_paid),title:"Amount Paid (Sats)",width:50,type:e.Gi.NUMBER},{key:"num_payments",value:n.num_payments,title:"# Payments",width:50,type:e.Gi.NUMBER}],[{key:"amount_received",value:Math.round(n.amount_received),title:"Amount Received (Sats)",width:50,type:e.Gi.NUMBER},{key:"num_invoices",value:n.num_invoices,title:"# Invoices",width:50,type:e.Gi.NUMBER}]];this.store.dispatch((0,t.qR)({payload:{data:{type:e.n_.INFORMATION,alertTitle:"Transaction Summary",message:f}}}))}applyFilter(){this.transactions&&(this.transactions.filter=this.selFilter.trim().toLowerCase())}getLabel(n){const f=this.nodePageDefs.reports[this.tableSetting.tableId].allowedColumns.find(v=>v.column===n);return f?f.label?f.label:this.camelCaseWithReplace.transform(f.column,"_"):this.commonService.titleCase(n)}setFilterPredicate(){this.transactions.filterPredicate=(n,f)=>{let v="";switch(this.selFilterBy){case"all":v=(n.date?(this.datePipe.transform(n.date,"dd/MMM")+"/"+n.date.getFullYear()).toLowerCase():"")+JSON.stringify(n).toLowerCase();break;case"date":v=this.datePipe.transform(new Date(n[this.selFilterBy]||0),this.dataRange===this.scrollRanges[1]?"MMM/yyyy":"dd/MMM/yyyy")?.toLowerCase()||"";break;default:v=typeof n[this.selFilterBy]>"u"?"":"string"==typeof n[this.selFilterBy]?n[this.selFilterBy].toLowerCase():"boolean"==typeof n[this.selFilterBy]?n[this.selFilterBy]?"yes":"no":n[this.selFilterBy].toString()}return v.includes(f)}}loadTransactionsTable(n){this.transactions=new d.by(n?[...n]:[]),this.setTableWidgets()}setTableWidgets(){this.transactions&&this.transactions.data&&this.transactions.data.length>0&&(this.transactions.sort=this.sort,this.transactions.sortingDataAccessor=(n,f)=>n[f]&&isNaN(n[f])?n[f].toLocaleLowerCase():n[f]?+n[f]:null,this.transactions.paginator=this.paginator,this.setFilterPredicate(),this.applyFilter())}onDownloadCSV(){this.transactions.data&&this.transactions.data.length>0&&this.commonService.downloadFile(this.dataList,"Transactions-report-"+this.dataRange.toLowerCase())}ngOnDestroy(){this.unSubs.forEach(n=>{n.next(),n.complete()})}}return s.\u0275fac=function(n){return new(n||s)(c.Y36(U.v),c.Y36(N.yh),c.Y36(y.uU),c.Y36(L.D3))},s.\u0275cmp=c.Xpm({type:s,selectors:[["rtl-transactions-report-table"]],viewQuery:function(n,f){if(1&n&&(c.Gf(T.YE,5),c.Gf(a.NW,5)),2&n){let v;c.iGM(v=c.CRH())&&(f.sort=v.first),c.iGM(v=c.CRH())&&(f.paginator=v.first)}},inputs:{dataRange:"dataRange",dataList:"dataList",selFilter:"selFilter",displayedColumns:"displayedColumns",tableSetting:"tableSetting"},features:[c._Bn([{provide:x.PG,useValue:{overlayPanelClass:"rtl-select-overlay"}},{provide:a.ye,useValue:(0,e.pt)("Transactions")}]),c.TTD],decls:43,vars:14,consts:[["fxLayout","column","fxFlex","100","fxLayoutAlign","space-between stretch",1,"padding-gap-x"],["fxLayout","column","fxLayoutAlign","start stretch"],["fxLayout","column","fxLayoutAlign","start stretch","fxLayout.gt-sm","row wrap",1,"page-sub-title-container","mt-1"],["fxFlex","70"],["fxFlex.gt-xs","30","fxLayoutAlign.gt-xs","space-between center","fxLayout","row","fxLayoutAlign","space-between stretch"],["fxLayout","column","fxFlex","49"],["tabindex","1","name","filterBy",3,"ngModel","ngModelChange","selectionChange"],[3,"value",4,"ngFor","ngForOf"],["matInput","","name","filter",3,"ngModel","ngModelChange","input","keyup"],["fxLayout","row","fxLayoutAlign","start start"],["fxLayout","column","fxFlex","100",1,"table-container",3,"perfectScrollbar"],["mat-table","","fxFlex","100","matSort","",1,"overflow-auto",3,"matSortActive","matSortDirection","dataSource"],["table",""],["matColumnDef","date"],["mat-header-cell","","mat-sort-header","",4,"matHeaderCellDef"],["mat-cell","",4,"matCellDef"],["matColumnDef","amount_paid"],["mat-header-cell","","mat-sort-header","","arrowPosition","before",4,"matHeaderCellDef"],["matColumnDef","num_payments"],["matColumnDef","amount_received"],["matColumnDef","num_invoices"],["matColumnDef","actions"],["mat-header-cell","",4,"matHeaderCellDef"],["mat-cell","","fxLayoutAlign","end center",4,"matCellDef"],["matColumnDef","no_transaction"],["mat-footer-cell","","colspan","4",4,"matFooterCellDef"],["mat-footer-row","",3,"ngClass",4,"matFooterRowDef"],["mat-header-row","",4,"matHeaderRowDef"],["mat-row","",4,"matRowDef","matRowDefColumns"],[1,"mb-1",3,"pageSize","pageSizeOptions","showFirstLastButtons"],[3,"value"],["mat-header-cell","","mat-sort-header",""],["mat-cell",""],["mat-header-cell","","mat-sort-header","","arrowPosition","before"],["fxLayoutAlign","end center"],["mat-header-cell",""],["fxLayoutAlign","center center",1,"bordered-box","table-actions-select"],["placeholder","Actions","tabindex","1",1,"mr-0"],[3,"click"],["mat-cell","","fxLayoutAlign","end center"],["mat-stroked-button","","color","primary","type","button","tabindex","4",1,"table-actions-button",3,"click"],["mat-footer-cell","","colspan","4"],[4,"ngIf"],["mat-footer-row","",3,"ngClass"],["mat-header-row",""],["mat-row",""]],template:function(n,f){1&n&&(c.TgZ(0,"div",0)(1,"div",1)(2,"div",2),c._UZ(3,"div",3),c.TgZ(4,"div",4)(5,"mat-form-field",5)(6,"mat-label"),c._uU(7,"Filter By"),c.qZA(),c.TgZ(8,"mat-select",6),c.NdJ("ngModelChange",function(P){return f.selFilterBy=P})("selectionChange",function(){return f.selFilter="",f.applyFilter()}),c.TgZ(9,"perfect-scrollbar"),c.YNc(10,u,2,2,"mat-option",7),c.qZA()()(),c.TgZ(11,"mat-form-field",5)(12,"mat-label"),c._uU(13,"Filter"),c.qZA(),c.TgZ(14,"input",8),c.NdJ("ngModelChange",function(P){return f.selFilter=P})("input",function(){return f.applyFilter()})("keyup",function(){return f.applyFilter()}),c.qZA()()()(),c.TgZ(15,"div",9)(16,"div",10)(17,"table",11,12),c.ynx(19,13),c.YNc(20,l,2,0,"th",14),c.YNc(21,_,3,4,"td",15),c.BQk(),c.ynx(22,16),c.YNc(23,h,2,0,"th",17),c.YNc(24,V,4,4,"td",15),c.BQk(),c.ynx(25,18),c.YNc(26,B,2,0,"th",17),c.YNc(27,Z,4,3,"td",15),c.BQk(),c.ynx(28,19),c.YNc(29,Y,2,0,"th",17),c.YNc(30,G,4,4,"td",15),c.BQk(),c.ynx(31,20),c.YNc(32,I,2,0,"th",17),c.YNc(33,W,4,3,"td",15),c.BQk(),c.ynx(34,21),c.YNc(35,q,6,0,"th",22),c.YNc(36,K,3,0,"td",23),c.BQk(),c.ynx(37,24),c.YNc(38,H,2,1,"td",25),c.BQk(),c.YNc(39,m,1,3,"tr",26),c.YNc(40,z,1,0,"tr",27),c.YNc(41,M,1,0,"tr",28),c.qZA(),c._UZ(42,"mat-paginator",29),c.qZA()()()()),2&n&&(c.xp6(8),c.Q6J("ngModel",f.selFilterBy),c.xp6(2),c.Q6J("ngForOf",c.DdM(12,J).concat(f.displayedColumns.slice(0,-1))),c.xp6(4),c.Q6J("ngModel",f.selFilter),c.xp6(3),c.Q6J("matSortActive",f.tableSetting.sortBy)("matSortDirection",f.tableSetting.sortOrder)("dataSource",f.transactions),c.xp6(22),c.Q6J("matFooterRowDef",c.DdM(13,j)),c.xp6(1),c.Q6J("matHeaderRowDef",f.displayedColumns),c.xp6(1),c.Q6J("matRowDefColumns",f.displayedColumns),c.xp6(1),c.Q6J("pageSize",f.pageSize)("pageSizeOptions",f.pageSizeOptions)("showFirstLastButtons",f.screenSize!==f.screenSizeEnum.XS))},dependencies:[y.mk,y.sg,y.O5,E.Fj,E.JJ,E.On,S.xw,S.Wh,S.yH,k.oO,b.lW,R.Nt,O.KE,O.hX,x.gD,x.$L,p.ey,T.YE,T.nU,d.BZ,d.fO,d.as,d.w1,d.Dz,d.nj,d.mD,d.Ke,d.ge,d.ev,d.yh,d.XQ,d.Gk,d.Q2,a.NW,g.Vv,g.$V,y.JJ,y.uU]}),s})()},3396:(Q,w,i)=>{i.d(w,{KfU:()=>P2,ctA:()=>r1});var P2={prefix:"far",iconName:"face-frown",icon:[512,512,[9785,"frown"],"f119","M464 256A208 208 0 1 0 48 256a208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zM174.6 384.1c-4.5 12.5-18.2 18.9-30.7 14.4s-18.9-18.2-14.4-30.7C146.9 319.4 198.9 288 256 288s109.1 31.4 126.6 79.9c4.5 12.5-2 26.2-14.4 30.7s-26.2-2-30.7-14.4C328.2 358.5 297.2 336 256 336s-72.2 22.5-81.4 48.1zM144.4 208a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zm192-32a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"]},r1={prefix:"far",iconName:"face-smile",icon:[512,512,[128578,"smile"],"f118","M464 256A208 208 0 1 0 48 256a208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zm177.6 62.1C192.8 334.5 218.8 352 256 352s63.2-17.5 78.4-33.9c9-9.7 24.2-10.4 33.9-1.4s10.4 24.2 1.4 33.9c-22 23.8-60 49.4-113.6 49.4s-91.7-25.5-113.6-49.4c-9-9.7-8.4-24.9 1.4-33.9s24.9-8.4 33.9 1.4zM144.4 208a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zm192-32a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"]}}}]);