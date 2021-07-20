/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/currentRecord', 'N/record', 'N/url'],
    function (currentRecord, record, url) {

        function pageInit(context) {

        }

        function imprimir(recId) {

            var scriptUrl = url.resolveScript({
                scriptId: "customscript_csc_ban_dep_pri_template_sl",
                deploymentId: "customdeploy_csc_ban_dep_pri_template_sl",
                params: {recId: recId}
            });
            // console.log(scriptUrl);
            window.open(scriptUrl, '_blank');
        }

        function saveRecord(context) {

        }

        function validateField(context) {

        }

        function fieldChanged(context) {

        }

        function postSourcing(context) {

        }

        function lineInit(context) {

        }

        function validateDelete(context) {

        }

        function validateInsert(context) {

        }

        function validateLine(context) {

        }

        function sublistChanged(context) {

        }

        return {
            pageInit: pageInit,
            imprimir: imprimir,
            // saveRecord: saveRecord,
            // validateField: validateField,
            // fieldChanged: fieldChanged,
            // postSourcing: postSourcing,
            // lineInit: lineInit,
            // validateDelete: validateDelete,
            // validateInsert: validateInsert,
            // validateLine: validateLine,
            // sublistChanged: sublistChanged
        }
    });
