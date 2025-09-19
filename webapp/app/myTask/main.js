import * as pdfjsLib from 'https://unpkg.com/pdfjs-dist@4.2.67/build/pdf.min.mjs';
import SignaturePad from 'https://unpkg.com/signature_pad@5.0.1/dist/signature_pad.min.js';





const SRC_STAMPS_LOCAL_STORAGE_KEY = 'pdf-stamps-srcStamps';

// The workerSrc property shall be specified.
pdfjsLib.GlobalWorkerOptions.workerSrc = '//unpkg.com/pdfjs-dist@4.2.67/build/pdf.worker.min.mjs';

const pdfRenderer = {
	numPages: 0,
	pageNum: 0,
	pdf: undefined,
	viewport: undefined,
	filename: '',
	stamps: []
}

const MassMode = {
	MassMode: false,
	Number: 0,
	currentDoc: 0,
	docsArray: []
};

const documentAttributes = {
	ID: undefined,
	Status: undefined
};




const pdf = 'document.pdf';

const pageNum = document.querySelector('#page_num');
const pageCount = document.querySelector('#page_count');
const currentPage = document.querySelector('#current_page');
const previousPage = document.querySelector('#prev_page');
const nextPage = document.querySelector('#next_page');

const newText = document.querySelector('#addText');
const addSignature = document.querySelector('#addSignature');
const canvas_signaturepad = document.getElementById('canvas_signaturepad');
const staticBackdrop = document.getElementById('staticBackdrop');
const padStampClear = document.getElementById('padStampClear');
const padStampAdd = document.getElementById('padStampAdd');
//const addQAnnotation = document.getElementById('addQAnnotation');
const quickAddContinue = document.getElementById('quickAddContinue');
const staticBackdropQuickAdd = document.getElementById('staticBackdropQuickAdd');

const enableSigning = document.querySelector('#enableSigning');

const btnParkAndProcess = document.querySelector('#btnParkAndProcess');

const groupPackedBy = document.querySelector('#groupPackedBy');
const groupCheckedBy = document.querySelector('#groupCheckedBy');
const groupReceivedBy = document.querySelector('#groupReceivedBy');
const groupNotes = document.querySelector('#groupNotes');
const groupEnableSigning = document.querySelector('#groupEnableSigning');

const receivedBy  = document.querySelector('#printName');
const notes       = document.querySelector('#Txtnotes');
const checkedBy   =	document.querySelector('#checkedBy');
const packedBy    = document.querySelector('#packedBy');

const btnClearAnnotations = document.querySelector('#btnClearAnnotations');


let pdfPlaceHolders = {};

let canvasText = undefined;

const initialState = {
	filename: '',
	stamps: [],
	viewport: undefined,
	pdfDoc: null,
	currentPage: 1,
	pageRendering: false ,
	pageCount: 0,
	zoom: 1.5,
	texts: []
};




let addDataAfterSignature = false;
const stampSection = document.getElementById("stampSection");
const dialog = document.getElementById('signature-dialog');
const colorPicker = document.getElementById('color-picker');
colorPicker.addEventListener('input', (event) => {
	signaturePad.penColor = event.target.value;
});



btnClearAnnotations.addEventListener('click', () => {
clearAnnotations();
});

function clearAnnotations() {
	document.getElementById('printName').value = '';
	document.getElementById('Txtnotes').value = '';
	document.getElementById('checkedBy').value = '';
	document.getElementById('packedBy').value = '';
	//clear all anotations on the page
	if (window.textCanvas === undefined || window.textCanvas == undefined) {
		return;
	}
	window.textCanvas.getObjects();
	var canvasObjects = window.textCanvas.getObjects();
	for (let i = canvasObjects.length - 1; i >= 0; i--) {
		window.textCanvas.remove(canvasObjects[i]);
	}
}

const oSignature = new SignaturePad(canvas_signaturepad);
const padCanvas = document.getElementById('padCanvas');



addSignature.addEventListener('click', () => {
	//enableSigning.checked = true;
	$(staticBackdrop).modal('toggle');

});
padStampClear.addEventListener('click', () => {
	oSignature.clear();
});


/* addQAnnotation.addEventListener('click', () => {
	pdfPlaceHolders.forEach(function (element) {
		addNewText(element.str, element.y , element.x , 8 );
	});

}); */

function base64ToArrayBuffer(base64) {
	var binaryString = window.atob(base64);
	var bytes = new Uint8Array(binaryString.length);
	for (var i = 0; i < binaryString.length; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}
	return bytes.buffer;
}


function setPadgroupsState(docStatus) {

	switch (docStatus) {
		case "A" : // Open
			packedBy.disabled = false;
			checkedBy.disabled = true;
			receivedBy.disabled = true;
			notes.disabled = false;
			enableSigning.checked = false;
			enableSigning.disabled = true;

			break;
		case "B": // Packed
			packedBy.disabled = true;
			checkedBy.disabled = false;
			receivedBy.disabled = true;
			notes.disabled = false;
			enableSigning.checked = false;
			enableSigning.disabled = true;
			break;
		case "C": // Checked
			packedBy.disabled = true;
			checkedBy.disabled = true;
			receivedBy.disabled = false;
			notes.disabled = true;
			enableSigning.checked = true;
			enableSigning.disabled = false;
			break;
		default:
			packedBy.disabled = true;
			checkedBy.disabled = true;
			receivedBy.disabled = true;
			notes.disabled = true;
			enableSigning.checked = true;
			enableSigning.disabled = false;
			break;
	}

}


window.addEventListener('message', function (event) {
	var otype = typeof event.data;
	if (event.data === 'anotateNextPdf') {
		addNewTextToPdf(pdfPlaceHolders);
	}
	if (event.data === 'clearAnnotations') {
		clearAnnotations();
	}
	if( event.data.ID !== undefined){
		console.log("Document Attributes received: ", event.data);
		documentAttributes.ID = event.data.ID;
		documentAttributes.Status = event.data.Status;
		setPadgroupsState(event.data.Status);
	}
	if (event.data.MassMode !== undefined) {
		//console.log("MassMode data received: ", event.data);
		MassMode.MassMode = event.data.MassMode;
		MassMode.Number = event.data.Number;
		MassMode.currentDoc = event.data.currentDoc;
		MassMode.docsArray = event.data.docsArray;
		if (MassMode.MassMode) {
			//enableSigning.checked = true;
			//document.getElementById('enableSigning').checked = false;
			//document.getElementById('DivMassMode').hidden = false;
		}else {
			//document.getElementById('DivMassMode').hidden = true;
			//enableSigning.checked = false;
			//document.getElementById('enableSigning').checked = true;
		}
		//console.log("MassMode data received: ", event.data);

	}
	if (event.data instanceof Blob) {

		//console.log("Message received from the parent: "); // Message received from parent

		const reader = new FileReader();
		reader.onload = function () {



			loadPdf(reader.result, event.data);

			if (window.textCanvas === undefined || window.textCanvas == undefined) {

			} else {
				var canvasObjects = window.textCanvas.getObjects();
				for (let i = canvasObjects.length - 1; i >= 0; i--) {
					window.textCanvas.remove(canvasObjects[i]);
				}
			}


		};
		reader.readAsDataURL(event.data);
		//initialState.filename = files[0].name;

	} else if (event.data == 'savePdf' || event.data == 'savepdf') {
		generateStampedPdf();
	}
});

window.addEventListener('oSaveDoc', function (event) {

	//generateStampedPdf();

});


async function loadPdf(src, _blob) {

	const buf = await _blob.arrayBuffer();

	const pdfExtract = new window.PDFExtractor();

	const buffer = buf;
	const options = {};
	pdfExtract.extractBuffer(buffer, options, (err, data) => {
		if (err) {
			console.error(err);
			return;
		}

		const filterValues = [
			"V1",
			"V2",
			"V3",
			"V4",
			"V5",
			"V6",
			"V7"
		];

		data.pages.forEach(function (page, index) {
			if (index == 0) {
				pdfPlaceHolders = page.content.filter(el =>
					filterValues.some(value => el.str.includes(value))
				);
				console.log(pdfPlaceHolders);

			}
		});

	//	console.log(data);
	});




/* 	btnParkAndProcess.addEventListener('click', () => {
		if (MassMode.MassMode) {
			window.parent.postMessage('parkAndProcessNext', "*");
			btnParkAndProcess.removeEventListener('click', this);
			return;
		}
	}); */



	quickAddContinue.addEventListener('click', () => {
		$(staticBackdropQuickAdd).modal('toggle');
		if ( enableSigning.checked ) {

		$(staticBackdrop).modal('toggle');
		 addDataAfterSignature = true;

		}else{
			addDataAfterSignature = false;
			addNewTextToPdf(pdfPlaceHolders);
		}





	});




	// Load the document.
	pdfjsLib
		.getDocument(src)
		.promise.then((data) => {
			initialState.pdfDoc = data;

		//	console.log('pdfDocument', initialState.pdfDoc);

			pageCount.textContent = initialState.pdfDoc.numPages;
			if (initialState.pageRendering === false) {
				renderPage()
			}

		}).then(() => {
		if (MassMode.MassMode && pdfPlaceHolders.length > 0) {
					  addNewTextToPdf(pdfPlaceHolders);
					}
		})
		.catch((err) => {
			console.error(err);
		});

}




function renderPdfNav() {
	if (pdfRenderer.numPages > 1) {
		pdfNav.style.display = 'flex';
	} else {
		pdfNav.style.display = 'none';
	}
}

function renderDownloadTab() {
	if (pdfRenderer.stamps.length > 0) {
		downloadTab.disabled = false;
	} else {
		downloadTab.disabled = true;
	}
}



async function generateStampedPdf() {

	const pdfDoc = await PDFLib.PDFDocument.load(await initialState.pdfDoc.getData());
	//const page = pdfDoc.getPage(initialState.currentPage - 1);
	pdfDoc.getPages().forEach((page, index) => {

		addFabrcionObjectToPdf(page)
	});



	// Save the modified PDF
	const pdfBytesWithWatermark = await pdfDoc.save();

	// Create a Blob from the PDF bytes and create an object URL
	const blob = new Blob([pdfBytesWithWatermark], { type: 'application/pdf' });
	const url = URL.createObjectURL(blob);
	//window.open(url);






	var lreader = new FileReader();
	lreader.readAsDataURL(blob);
	lreader.onloadend = function () {
		var base64data = lreader.result;
		window.parent.postMessage(base64data, "*");

	}





	/* // Create a link to download the watermarked PDF
	const downloadLink = document.createElement('a');
	downloadLink.href = url;
	downloadLink.download = pdfRenderer.filename.replace('.pdf', '-stamped.pdf');
	document.body.append(downloadLink);
	downloadLink.click();

	// Clean up the object URL
	URL.revokeObjectURL(url);
	down
	loadLink.remove(); */
}

// fit on mobile



// Initial call to resizePageBox on page load
//resizePageBox();


function PopPage() {
	let markerArea = new markerjs2.MarkerArea(document.getElementById('pageBox'));

	// register an event listener for when user clicks OK/save in the marker.js UI
	markerArea.addEventListener('render', event => {
		// we are setting the markup result to replace our original image on the page
		// but you can set a different image or upload it to your server
		document.getElementById('myimg').src = event.dataUrl;
	});

	// finally, call the show() method and marker.js UI opens
	markerArea.settings.displayMode = 'popup';
	markerArea.show();

}


//new code




// Render the page.
const renderPage = () => {
	// Load the first page.

	initialState.pdfDoc
		.getPage(initialState.currentPage)
		.then((page) => {
			//console.log('page', page);

			const canvas = document.getElementById('canvas');
			const ctx = canvas.getContext('2d');
			const viewport = page.getViewport({
				scale: initialState.zoom,
			});
			initialState.viewport = viewport;

			canvas.height = viewport.height;
			canvas.width = viewport.width;

			// Render the PDF page into the canvas context.
			const renderCtx = {
				canvasContext: ctx,
				viewport: viewport,
			};

			//page.render(renderCtx);


			var renderTask = page.render(renderCtx);
			initialState.pageRendering = true;

			// Wait for rendering to finish
			renderTask.promise.then(function () {
				initialState.pageRendering = false;
			});


			pageNum.textContent = initialState.currentPage;

			if (window.textCanvas === undefined || window.textCanvas == undefined) {

				let textCanvas = document.createElement('canvas');
				textCanvas.height = initialState.viewport.height;
				textCanvas.width = initialState.viewport.width;

				pageBox.append(textCanvas);
				textCanvas = new fabric.Canvas(textCanvas, {
					containerClass: 'overlay2'
				});
				textCanvas.on({
					'object:modified': callbackModifyingText

				});





				textCanvas.setZoom(initialState.zoom);
				window.textCanvas = textCanvas;
				window.textCanvas.on('object:selected', function (e) {

					console.log(e);
				});



			}

			let mainCanvas = document.getElementById('canvas');
			mainCanvas.setAttribute('class', 'overlay0');





			//renderStamps();

			//resizePageBox();
			//renderPdfNav();
			//renderDownloadTab();
		});
};



const showPrevPage = () => {
	if (initialState.pdfDoc === null || initialState.currentPage <= 1)
		return;
	initialState.currentPage--;
	// Render the current page.
	currentPage.value = initialState.currentPage;
	renderPage();
};

const showNextPage = () => {
	if (
		initialState.pdfDoc === null ||
		initialState.currentPage >= initialState.pdfDoc._pdfInfo.numPages
	)
		return;

	initialState.currentPage++;
	currentPage.value = initialState.currentPage;
	renderPage();
};

// Button events.
previousPage.addEventListener('click', showPrevPage);
nextPage.addEventListener('click', showNextPage);

// Keypress event.
currentPage.addEventListener('keypress', (event) => {
	if (initialState.pdfDoc === null) return;
	// Get the key code.
	const keycode = event.keyCode ? event.keyCode : event.which;

	if (keycode === 13) {
		// Get the new page number and render it.
		let desiredPage = currentPage.valueAsNumber;
		initialState.currentPage = Math.min(
			Math.max(desiredPage, 1),
			initialState.pdfDoc._pdfInfo.numPages,
		);
		currentPage.value = initialState.currentPage;
		renderPage();
	}
});

// Zoom events.
/* zoomIn.addEventListener('click', () => {
	if (initialState.pdfDoc === null) return;
	initialState.zoom *= 4 / 3;
	renderPage();
});

zoomOut.addEventListener('click', () => {
	if (initialState.pdfDoc === null) return;
	initialState.zoom *= 2 / 3;
	renderPage();
}); */

// Tooltip.
const tooltipTriggerList = [].slice.call(
	document.querySelectorAll('[data-bs-toggle="tooltip"]'),
);
const tooltipList = tooltipTriggerList.map((tooltipTriggerEl) => {
	return new bootstrap.Tooltip(tooltipTriggerEl);
});



// add text

window.textCanvas = undefined;
const deleteIcon =
	"data:image/svg+xml,%3C%3Fxml version='1.0' encoding='utf-8'%3F%3E%3C!DOCTYPE svg PUBLIC '-//W3C//DTD SVG 1.1//EN' 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'%3E%3Csvg version='1.1' id='Ebene_1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' width='595.275px' height='595.275px' viewBox='200 215 230 470' xml:space='preserve'%3E%3Ccircle style='fill:%23F44336;' cx='299.76' cy='439.067' r='218.516'/%3E%3Cg%3E%3Crect x='267.162' y='307.978' transform='matrix(0.7071 -0.7071 0.7071 0.7071 -222.6202 340.6915)' style='fill:white;' width='65.545' height='262.18'/%3E%3Crect x='266.988' y='308.153' transform='matrix(0.7071 0.7071 -0.7071 0.7071 398.3889 -83.3116)' style='fill:white;' width='65.544' height='262.179'/%3E%3C/g%3E%3C/svg%3E";

const cloneIcon =
	"data:image/svg+xml,%3C%3Fxml version='1.0' encoding='iso-8859-1'%3F%3E%3Csvg version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='0 0 55.699 55.699' width='100px' height='100px' xml:space='preserve'%3E%3Cpath style='fill:%23010002;' d='M51.51,18.001c-0.006-0.085-0.022-0.167-0.05-0.248c-0.012-0.034-0.02-0.067-0.035-0.1 c-0.049-0.106-0.109-0.206-0.194-0.291v-0.001l0,0c0,0-0.001-0.001-0.001-0.002L34.161,0.293c-0.086-0.087-0.188-0.148-0.295-0.197 c-0.027-0.013-0.057-0.02-0.086-0.03c-0.086-0.029-0.174-0.048-0.265-0.053C33.494,0.011,33.475,0,33.453,0H22.177 c-3.678,0-6.669,2.992-6.669,6.67v1.674h-4.663c-3.678,0-6.67,2.992-6.67,6.67V49.03c0,3.678,2.992,6.669,6.67,6.669h22.677 c3.677,0,6.669-2.991,6.669-6.669v-1.675h4.664c3.678,0,6.669-2.991,6.669-6.669V18.069C51.524,18.045,51.512,18.025,51.51,18.001z M34.454,3.414l13.655,13.655h-8.985c-2.575,0-4.67-2.095-4.67-4.67V3.414z M38.191,49.029c0,2.574-2.095,4.669-4.669,4.669H10.845 c-2.575,0-4.67-2.095-4.67-4.669V15.014c0-2.575,2.095-4.67,4.67-4.67h5.663h4.614v10.399c0,3.678,2.991,6.669,6.668,6.669h10.4 v18.942L38.191,49.029L38.191,49.029z M36.777,25.412h-8.986c-2.574,0-4.668-2.094-4.668-4.669v-8.985L36.777,25.412z M44.855,45.355h-4.664V26.412c0-0.023-0.012-0.044-0.014-0.067c-0.006-0.085-0.021-0.167-0.049-0.249 c-0.012-0.033-0.021-0.066-0.036-0.1c-0.048-0.105-0.109-0.205-0.194-0.29l0,0l0,0c0-0.001-0.001-0.002-0.001-0.002L22.829,8.637 c-0.087-0.086-0.188-0.147-0.295-0.196c-0.029-0.013-0.058-0.021-0.088-0.031c-0.086-0.03-0.172-0.048-0.263-0.053 c-0.021-0.002-0.04-0.013-0.062-0.013h-4.614V6.67c0-2.575,2.095-4.67,4.669-4.67h10.277v10.4c0,3.678,2.992,6.67,6.67,6.67h10.399 v21.616C49.524,43.26,47.429,45.355,44.855,45.355z'/%3E%3C/svg%3E%0A";

const deleteImg = document.createElement('img');
deleteImg.src = deleteIcon;

const cloneImg = document.createElement('img');
cloneImg.src = cloneIcon;

fabric.Object.prototype.transparentCorners = false;
fabric.Object.prototype.cornerColor = 'blue';
fabric.Object.prototype.cornerStyle = 'circle';




function addNewText(textValue = 'New Text', top = initialState.viewport.height / 5, left = initialState.viewport.width / 4, fontSize = 15) {
	var newID = (new Date()).getTime().toString().substr(5);



	var text = new fabric.IText(textValue, {
		lockUniScaling: true,
		dirty: false,
		fontSize: fontSize ,
		fill : '#0a0a0aff' ,
		textBackgroundColor: 'rgba(255, 255, 255, 1)',
		fontFamily: 'Times New Roman',
		left: left,
		top: top,
		myid: newID,
		objecttype: 'text'

	});

	text.controls.deleteControl = new fabric.Control({
		x: 0.5,
		y: -0.5,
		offsetY: -16,
		offsetX: 16,
		cursorStyle: 'pointer',
		mouseUpHandler: deleteObject,
		render: renderIcon(deleteImg),
		cornerSize: 24,
	});

	text.controls.cloneControl = new fabric.Control({
		x: -0.5,
		y: -0.5,
		offsetY: -16,
		offsetX: -16,
		cursorStyle: 'pointer',
		mouseUpHandler: cloneObject,
		render: renderIcon(cloneImg),
		cornerSize: 24,
	});

	window.textCanvas.add(text);
	window.textCanvas.setActiveObject(text);
	window.textCanvas.renderAll();

}

newText.addEventListener('click', () => {
	addNewText();
});


padStampAdd.addEventListener('click', () => {

	if (addDataAfterSignature) {
		addNewTextToPdf(pdfPlaceHolders);
	} else {
		if(enableSigning.checked){

		addImage();
		}
	}
});

function collectInputData() {
	let name      = document.getElementById('printName').value;
	let notes     = document.getElementById('Txtnotes').value;
	let checkedBy =	document.getElementById('checkedBy').value;
	let packedBy  = document.getElementById('packedBy').value;

	let _date     = ''
	let _time     = '';

	if(documentAttributes.Status === "C")
   {
		_date = moment().format("MMM Do YY");
		_time = moment().format('h:mm:ss a');
	}

	const inputData = {
		"V1": name,
		"V2": notes,
		"V3": '',
		"V4": _date,
		"V5": _time,
		"V6": checkedBy,
		"V7": packedBy

	};

	if (!MassMode.MassMode) {

	document.getElementById('printName').value = '';
	document.getElementById('Txtnotes').value = '';
	document.getElementById('checkedBy').value = '';
	document.getElementById('packedBy').value = '';
	}
	return inputData;
}

function addNewTextToPdf(pdfPlaceHolders) {
	const inputData = collectInputData();
	const filterValues = [
		"V1",
		"V2",
		"V3",
		"V4",
		"V5",
		"V6",
		"V7"
	];

	pdfPlaceHolders.forEach(function (element) {
		if (element.str.includes("V3")) {
			addDataAfterSignature = false;
			addImage(element.y, element.x);
		}

		const key = filterValues.find(value => element.str.includes(value));
		if (key && inputData[key]) {
			addNewText(inputData[key], element.y, element.x, 9.5);
		}
	});
}

function addImage(top = 150, left = 150) {
	if(!enableSigning.checked  ){
		return;
	}
	$(staticBackdrop).modal('toggle');

	if (!oSignature.isEmpty()) {
		var imgUrl = oSignature.toDataURL('image/png', {
			ratio: 1,
			width: 100,
			height: 100
		});


		var newImag = fabric.Image.fromURL(imgUrl, (img) => {

			img.set({
				transparentCorners: false,
				top: top,
				left: left


			});

			img.scaleToHeight(80);
			img.scaleToWidth(80);
			/* img.controls.deleteControl = new fabric.Control({
				x: 0.5,
				y: -0.5,
				offsetY: -16,
				offsetX: 16,
				cursorStyle: 'pointer',
				mouseUpHandler: deleteObject,
				render: renderIcon(deleteImg),
				cornerSize: 24,
			});

			img.controls.cloneControl = new fabric.Control({
				x: -0.5,
				y: -0.5,
				offsetY: -16,
				offsetX: -16,
				cursorStyle: 'pointer',
				mouseUpHandler: cloneObject,
				render: renderIcon(cloneImg),
				cornerSize: 24,
			});
 */



			window.textCanvas.add(img);

			window.textCanvas.setActiveObject(img);
			window.textCanvas.renderAll();
			oSignature.clear();

		});



		dialog.close();
	}
}


function deleteObject(_eventData, transform) {
	const canvas = transform.target.canvas;
	canvas.remove(transform.target);
	canvas.requestRenderAll();
}

function cloneObject(_eventData, transform) {
	const canvas = transform.target.canvas;


	transform.target.clone(function (cloned) {
		cloned.left += 10;
		cloned.top += 10;
		cloned.controls.deleteControl = transform.target.controls.deleteControl;
		cloned.controls.cloneControl = transform.target.controls.cloneControl;
		canvas.add(cloned);

		canvas.setActiveObject(cloned);
		canvas.renderAll();
	});
}

function renderIcon(icon) {
	return function (ctx, left, top, _styleOverride, fabricObject) {

		if (fabricObject._element !== undefined) {
			if (fabricObject._element.className === 'canvas-img') {
				return;
			}
		}

		const size = this.cornerSize;
		ctx.save();
		ctx.translate(left, top);
		ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle));
		ctx.drawImage(icon, -size / 2, -size / 2, size, size);
		ctx.restore();
	};
}


function callbackModifyingText(e) {
	console.log(e);
	e.target.setCoords()
	window.textCanvas.renderAll();
	console.log(e);


}

function callbackSelectedObject(e) {
	console.log(e);
	//e.target.setCoords()
	//window.textCanvas.renderAll();
	//console.log(e);

}



async function addFabrcionObjectToPdf(pdfPage) {

	//await getFields(pdfPage.doc , pdfPage);



	var objects = window.textCanvas.getObjects();
	var pageWidth = pdfPage.getWidth();
	var pageHeight = pdfPage.getHeight();

	const timesRomanFont = await pdfPage.doc.embedFont(PDFLib.StandardFonts.TimesRoman)
	pdfPage.doc.embedStandardFont(PDFLib.StandardFonts.TimesRoman)
	pdfPage.translateContent(0, 0);
	objects.forEach(function (obj) {
		if (obj.type === 'i-text') {
			//obj.scale(initialState.zoom);

			var rgbObj = rgbStringToObject(obj.fill);

			// const words = obj.text.split(' ');
			// if (words.length > 3) {
			// 	let newText = '';
			// 	for (let i = 0; i < words.length; i++) {
			// 		newText += words[i] + ' ';
			// 		if ((i + 1) % 3 === 0 && i !== words.length - 1) {
			// 			newText = newText.trim() + '\n';
			// 		}
			// 	}
			// 	obj.text = newText.trim();
			// }
			//pdfPage.setFontColor(PDFLib.rgb(rgbObj.r / 255, rgbObj.g / 255, rgbObj.b / 255));

			pdfPage.drawText(obj.text, {
				x: obj.left,
				y: pdfPage.getHeight() - obj.top - obj.getScaledHeight() + 5,
				size: obj.fontSize * obj.scaleY,
				font: timesRomanFont,
				width: obj.getScaledWidth(),
				height: obj.getScaledHeight()



			});
		}
		if (obj.type === 'image') {
			//obj.scale(initialState.zoom);

			(async () => {
				const image = await pdfPage.doc.embedPng(obj.getSrc());

				pdfPage.drawImage(image, {
					x: obj.left,
					y: pdfPage.getHeight() - obj.top - obj.getScaledHeight(),
					width: obj.getScaledWidth(),
					height: obj.getScaledHeight()
					// TODO: blendMode use cases?
				});
			})();





		}

	});
	//renderPage();


}

function rgbStringToObject(rgbString) {
	const rgbRegex = /rgb\((\d+),(\d+),(\d+)\)/;
	const match = rgbRegex.exec(rgbString);
	if (match) {
		const r = parseInt(match[1], 10);
		const g = parseInt(match[2], 10);
		const b = parseInt(match[3], 10);
		return { r, g, b };
	}
	return { r: 0, g: 0, b: 0 };
}




