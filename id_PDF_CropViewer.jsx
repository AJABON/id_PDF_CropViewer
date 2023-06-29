//id_PDF_CropViewer.jsx　by（z-） ver_e
//@target indesign
//@targetengine "PDFCROP"

function cp(mes){
	//$.writeln(mes);
	//alert(mes);
	}

///////////////// UIパーツ表示関連 ///////////
function pointSizeFunc(obj){ //UIフォントちっさく
	for(var i=0; i<obj.children.length; i++){
		childObj=obj.children[i];
		if(typeof childObj.children !="undefined"){
			pointSizeFunc(childObj);
			}
		childObj.graphics.font=fontObj;
		}
	}

function boundsFunc(obj){ //UIアイテムつめつめ
	for(var i=0; i<obj.children.length; i++){
		childObj=obj.children[i];
		try{
			childObj.preferredSize[1]-=2;
			childObj.spacing=0;
			}
		catch(e){
			continue;
			}
		if((childObj.reflect.name=="Group") || (childObj.reflect.name=="Panel")){
			boundsFunc(childObj);
			}
		}
	}

function filtG(obj){ //グループの中身を選択、ガワを非選択に
	obj.pageItems.everyItem().select(SelectionOptions.ADD_TO);
	if(obj.groups.length){
		var gObj=obj.groups.everyItem();
		gObj.select(SelectionOptions.REMOVE_FROM);
		filtG(gObj);
		}
	}

function selFunc(){
	if(! app.documents.length) return false;
	var doc=app.activeDocument;
	var selD=doc.selection; //デフォルトの選択範囲
	if(! selD.length) return false;
	var ary=selD;
	for(var i=0; i<ary.length; i++){ //グループをばらす
		if(ary[i].reflect.name=="Group"){
			ary[i].select(SelectionOptions.REMOVE_FROM);
			filtG(ary[i]);
			}
		}
	var doc=app.activeDocument;
	var sel=doc.selection;
	var ary2=[];
	for(var i=0; i<sel.length; i++){
		if("pdfs" in sel[i]){
			ary2.push(sel[i].pdfs[0]);
			}
		if(sel[i].reflect.name=="PDF"){
			ary2.push(sel[i]);
			}
		}
	doc.selection=selD;
	return ary2;
	}

function readFunc(obj){
	for(var i=0; i<cropIndexAry.length; i++){
		if(obj==cropIndexAry[i]){
			return i;
			}
		}
	}

function letFunc(ind){
	app.pdfPlacePreferences.pdfCrop=cropIndexAry[ind];
	}

var dlg="palette{orientation:'column', text:'PDF Crop Viewer_e', \
BG:Group{\
RB:Button{text:'みる'}, \
LB:Button{text:'かえる'}\
}, \
C:Checkbox{text:'削除してから再配置', value:true}, \
AG: Group{orientation:'row', \
S: StaticText{text:'配置設定：'}, \
D: DropDownList{}\
} \
GG: Group{orientation:'row', \
S: StaticText{text:'選択範囲：'}, \
D: DropDownList{}\
} \
}";


var crop, cropIndexAry;
if(parseFloat(app.version) < 7){ //CS4以下
	crop=["バウンディングボックス",  "アート", "トリミング", "トンボ", "裁ち落とし", "メディア"];
	cropIndexAry=[PDFCrop.CROP_CONTENT, PDFCrop.CROP_ART, PDFCrop.CROP_PDF, PDFCrop.CROP_TRIM, PDFCrop.CROP_BLEED, PDFCrop.CROP_MEDIA];
	}
else{
	crop=["アート", "トリミング", "トンボ", "裁ち落とし", "メディア", "境界線ボックス（表示中のレイヤーのみ）", "境界線ボックス（すべてのレイヤー）"];
	cropIndexAry=[PDFCrop.CROP_ART, PDFCrop.CROP_PDF, PDFCrop.CROP_TRIM, PDFCrop.CROP_BLEED, PDFCrop.CROP_MEDIA, PDFCrop.CROP_CONTENT_VISIBLE_LAYERS, PDFCrop.CROP_CONTENT_ALL_LAYERS];
	}

var win=new Window(dlg);
win.spacing=0;
var fontObj=ScriptUI.newFont(win.graphics.font.family, win.graphics.font.style, 10);
pointSizeFunc(win); //いまのSUIでは無意味
boundsFunc(win);
if(parseFloat(app.version) < 7){ //CS4以下
	win.AG.D.size=[150,20];
	win.GG.D.size=[150,20];
	}
else{
	win.AG.D.size=[260,20];
	win.GG.D.size=[260,20];
	}
for(var i in crop){
	win.AG.D.add("item", crop[i]);
	win.GG.D.add("item", crop[i]);
	}

win.onShow=function(){
	win.BG.RB.notify("onClick");
	}

win.BG.RB.onClick=function(){
	win.AG.D.selection=(readFunc(app.pdfPlacePreferences.pdfCrop));
	var pdfAry=selFunc();
	if(pdfAry==false || pdfAry.length != 1){
		win.GG.D.selection=null;
		return;
		}
	var targetObj=pdfAry[0];
	win.GG.D.selection=(readFunc(targetObj.pdfAttributes.pdfCrop));
	}

win.BG.LB.onClick=function(){
	if(!win.GG.D.selection){
		return;
	}
	var pdfAry=selFunc();
	if(pdfAry.length === 0){
		return;
	}
	var pdfObj, parentObj, visiAry=[], updateObj;
	letFunc(win.GG.D.selection.index); 
	for(var i in pdfAry){
		if(pdfAry[i].pdfAttributes.pdfCrop==app.pdfPlacePreferences.pdfCrop) continue;
		app.pdfPlacePreferences.pageNumber=pdfAry[i].pdfAttributes.pageNumber;
		app.pdfPlacePreferences.transparentBackground=pdfAry[i].pdfAttributes.transparentBackground;
		for(var j=0; j<pdfAry[i].graphicLayerOptions.graphicLayers.length; j++){
			visiAry.push(pdfAry[i].graphicLayerOptions.graphicLayers[j].currentVisibility);
			}
		updateObj=pdfAry[i].graphicLayerOptions.updateLinkOption;
		// pdfObj=File(getPath(pdfAry[i]));
		pdfObj=pdfAry[i].itemLink.filePath;
		parentObj=pdfAry[i].parent;
		if(win.C.value){
			pdfAry[i].remove();
			}
		parentObj.place(pdfObj);
		pdfAry[i]=parentObj.allGraphics[0];
		pdfAry[i].graphicLayerOptions.updateLinkOption=updateObj;
		for(var k in visiAry){
			pdfAry[i].graphicLayerOptions.graphicLayers[k].currentVisibility=visiAry.shift();
			}
		cp(8);
		}
	letFunc(win.AG.D.selection.index); 
	app.pdfPlacePreferences.pageNumber=1; //0だと「パラメーターが不正です」エラー
	//app.pdfPlacePreferences.transparentBackground=true;
	}

win.show();
