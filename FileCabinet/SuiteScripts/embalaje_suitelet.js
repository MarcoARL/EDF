/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define(['N/record','N/search','N/render','N/file'], function(record,search,render,file) {

    function onRequest(context) {
        var id = JSON.parse(context.request.parameters.value);
        var response = context.response;
        log.audit({title:'url:',details:id});
//obtener datos del envio
        var records = record.load({
            type: record.Type.ITEM_FULFILLMENT, 
            id: id,
            isDynamic: true,
        });
        var count = records.getLineCount({
            sublistId: 'item'
        });
        var createdfrom = records.getValue('createdfrom');

        var traslados = record.load({
            type: record.Type.TRANSFER_ORDER,
            id: createdfrom,
            isDynamic: true
        });

        var origen = traslados.getValue('location');
        var destino = traslados.getValue('transferlocation');
        var countTraslados = records.getLineCount({
            sublistId: 'item'
        });
        var subsidiaria = traslados.getValue('subsidiary');

        var subsidiary_record = record.load({
            type: record.Type.SUBSIDIARY, 
            id: subsidiaria,
            isDynamic: true,
        });
        var subsidiary_logo_url = subsidiary_record.getValue('logo');
      if(subsidiary_logo_url){
        var file_logo = file.load({id: subsidiary_logo_url});
        var subsidiary_logo = file_logo.url;
      }else{
        var subsidiary_logo = '';
      }

        var origen_data = record.load({
            type: record.Type.LOCATION,
            id: origen,
            isDynamic:true
        });
        var destino_data = record.load({
            type: record.Type.LOCATION,
            id: destino,
            isDynamic: true
        });


        //get date
        var fecha_emision = new Date();
        fecha_emision = records.getValue('trandate') || '';
        if(fecha_emision){
            var date_emision = fecha_emision.getDate() +'/' + fecha_emision.getMonth()+'/'+fecha_emision.getFullYear();
        }else{
            var date_emision = fecha_emision;
        }


        var datosJson = new Object();
        datosJson.id = id;
        datosJson.fecha = date_emision || '';
        datosJson.clave = records.getValue('tranid') || '';
        datosJson.version = '';
        datosJson.elaboro = '';
        datosJson.reviso = '';
        datosJson.autorizo = '';
        datosJson.folio = records.getValue('tranid') || '';
        datosJson.bultos = records.getValue('custbody_csc_embalaje_bultos') || '';
        datosJson.peso = records.getValue('custbody_csc_embalaje_peso') || '';
        datosJson.medidas = records.getValue('custbody_csc_embalaje_medidas') || '';
        datosJson.empresa_nombre = traslados.getText('location');
        datosJson.empresa_direccion = origen_data.getValue('mainaddress_text');
        datosJson.empresa_telefono = origen_data.getValue('phone');
        datosJson.consignado_nombre = traslados.getText('transferlocation');
        datosJson.consignado_direccion = destino_data.getValue('mainaddress_text');
        datosJson.consignado_telefono = destino_data.getValue('phone');
        datosJson.incoterm = traslados.getText('incoterm');
        datosJson.subsidiaria_logo = subsidiary_logo;
        datosJson.items = [];

        var objItem = {};

        for(var i=0;i<count;i++){

            objItem = {};
            objItem.index = i+1;

            objItem.item = records.getSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                line: i
            });

            objItem.serie = objItem.item;

            try{
                var item_desc = record.load({
                    type: record.Type.INVENTORY_ITEM, 
                    id: objItem.item,
                    isDynamic: true,
                });

                objItem.descripcion = item_desc.getValue('itemid');
            }catch (err){
                var item_desc = record.load({
                    type: record.Type.NON_INVENTORY_ITEM, 
                    id: objItem.item,
                    isDynamic: true,
                });

                objItem.descripcion = item_desc.getValue('itemid');
            }

            for(var x=0;x<countTraslados;x++){
                var arttraslado = records.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: x
                });

                if(objItem.item==arttraslado){
                    objItem.qtyordenada = traslados.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        line: x
                    });
        
                    objItem.qtyenviada = traslados.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantitypacked',
                        line: x
                    });
                    objItem.units = traslados.getSublistText({
                        sublistId: 'item',
                        fieldId: 'units',
                        line: x
                    });
                    objItem.peso = 'KG';
                }

                
            }

            datosJson.items.push(objItem);
        }


log.audit({title:'datos', details:datosJson});
//render
        var render_pdf = render.create();
        
        render_pdf.setTemplateById(140);
        var transactionFile = null;

        render_pdf.addCustomDataSource({ format: render.DataSource.OBJECT, alias: "RECORD_PDF", data: datosJson });

        try {

            transactionFile = render_pdf.renderAsPdf();
            response.writeFile({
                file: transactionFile,
                isInline: true
            });
        }
        catch (e) {
            log.error("ERROR", e);
            response.write("INFO: Ha ocurrido un error al intentar crear la plantilla");
            return;
        }


    }

    return {
        onRequest: onRequest
    }
});
