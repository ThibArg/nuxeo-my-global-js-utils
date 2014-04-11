/*
 * (C) Copyright 2014 Nuxeo SA (http://nuxeo.com/) and contributors.
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the GNU Lesser General Public License
 * (LGPL) version 2.1 which accompanies this distribution, and is available at
 * http://www.gnu.org/licenses/lgpl.html
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * Contributors:
 *     Thibaud Arguillere
 */

 /*	We set-up everything in the jQuery(document).ready() function.
  *
  * To avoid collision with future - possibly - Nuxeo objects, the
  * elements here have a NMGU_ prefix. WHich looks ugly, but why
  * should we care? It goes for "Nuxe, My Global JavaScript Utilities"
  *
  */

  if(typeof NMGU === "undefined") {
  	NMGU = {

  		genericSuccessCB : function(inData, inStatusText, inXHR) {
			/* Nothing */
		},

		genericErrorCB : function(inXHR, inStatusText, inErrorText) {
			console.log("genericErrorCB/StatusText: " + inStatusText);
			console.log("genericErrorCB/ErrorText: " + inErrorText);
		},

		singleVoidOperationWrapper : function(inOperationId, inSuccessCB, inErrorCB) {
			var theURL = "/nuxeo/site/api/v1/id/" + ctx.currentDocument + "/@op/" + inOperationId;

			inSuccessCB = typeof inSuccessCB === "function" ? inSuccessCB : this.genericSuccessCB;
			inErrorCB = typeof inErrorCB === "function" ? inErrorCB : this.genericErrorCB;

			jQuery.ajax({
				url		: theURL,
				type	: "POST",
				contentType: "application/json+nxrequest",
				data	: '{"params":{}}',
				headers	: {'X-NXVoidOperation': true}
			})
			.done(inSuccessCB)
			.fail(inErrorCB);
		},

		/*	isDocumentLocked
			The callback receives just one parameter, telling if the document is locked or not:
			NMGU_isDocumentLocked(function(isLocked) {
				if(isLocked) {
					//. . .
				} else {
					// . . .
				}
			});

			In case of error, isLocked is always set to false
		*/
		isDocumentLocked : function(inCB) {
			var theURL = "/nuxeo/site/api/v1/id/" + ctx.currentDocument;

			jQuery.ajax({
				url : theURL,
				contentType: "application/json+nxrequest",
			})
			.done(function(inData, inStatusText, inXHR) {
				inCB( "lockOwner" in inData && inData.lockOwner != "" );
			})
			.fail(function(inXHR, inStatusText, inErrorText) {
				inCB(false);
			});
		},

		currentDocument : {}
  	};
  }

 jQuery(document).ready(function() {

 	var url = "/nuxeo/site/api/v1/id/" + ctx.currentDocument;

	jQuery.ajax({
		url : url,
		contentType: "application/json+nxrequest",
	})
	.done(function(inData, inStatusText, inXHR) {
		NMGU.currentDocument = inData;
	})
	.fail(function(inXHR, inStatusText, inErrorText) {
		NMGU.currentDocument = null;
	})
	.always(function() {
		// debug
		//console.log("RESULT OF GETTING THE DOC");
		//console.log(JSON.stringify(NMGU.currentDocument));
	});


 	// ======================================================================
 	// Change the "Edit locally synchronized file"
 	// ======================================================================
 	//		- Change the label
 	//		- Automatically lock the doc when the link is clicked *and* alt key
 	//		  is pressed.

 	// Get the <a> element handled by Drive.
	var driveEditLink = jQuery("a[href^='nxdrive://edit/']");
	if(driveEditLink.length === 1) {
		var kLABEL = "Edit"; //"Edit with native application"

		// Change the lable/title/alt. It depends if the link is displayed as a button or in the "more" dropdown.
		// In one case (button) we have an img child, whose title is used for the tip.
		// in the other, the label is in a span. But there (also is an img for the icon)
		// So the following is not hyper-strict, of course, but still: It works as of today ;->
		var subElement = driveEditLink.find("span");
		if(subElement.length == 1) {
			subElement.text(kLABEL);
		} else {
			subElement = driveEditLink.children();
			subElement[0].title = kLABEL;
			subElement[0].alt = kLABEL;
		}

		// When the "Edit" link is clicked, lock the document
		driveEditLink.on("click", function(inEvt) {
		 	NMGU.isDocumentLocked( function(isLocked) {
		 		if(!isLocked) {
		 			NMGU.singleVoidOperationWrapper(
						"Document.Lock",
						function(inData, inStatusText, inXHR) {
							// We can't call the Seam.Refresh operaiton, bcause there is no Seam
							// context from a REST call. So, let's just force refresh the window
							// so the "lock" button is correctly displayed
							//NMGU_singleVoidOperationWrapper("Seam.Refresh");
							window.location.href = window.location.href;
						},
						function(inXHR, inStatusText, inErrorText) {
							window.location.href = window.location.href;;//NMGU_singleVoidOperationWrapper("Seam.Refresh");
						}
					);
		 		}
		 	});
		});
	}

	// ======================================================================
 	// Other...
 	// ======================================================================

});

//--EOF--