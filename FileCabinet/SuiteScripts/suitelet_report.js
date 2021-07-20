/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define(['N/record','N/search','N/render','N/file','N/xml','N/format/i18n'], function(record,search,render,file,xml,format) {

    function onRequest(context) {
        var id = JSON.parse(context.request.parameters.value);
        var response = context.response;
        log.audit({title:'url:',details:id});
//obtener datos de la orden de compra
        var records = record.load({
            type: record.Type.PURCHASE_ORDER, 
            id: id,
            isDynamic: true,
        });

        var counts = records.getLineCount({
            sublistId: 'item'
        });
        var proveedor = records.getValue('entity');
        var subsidiaria = records.getValue('subsidiary');
        var total = records.getValue('total');
        var subtotal = records.getValue('subtotal');
        var taxtotal = records.getValue('taxtotal');
        var currency = records.getText('currency');
        var employee = records.getValue('employee');
      	var ubicacion_ped = records.getValue('location');

      	var totales_format = format.getCurrencyFormatter({currency: currency});
      	var totales_symbol = totales_format.symbol;
        totales_format = totales_format.numberFormatter;


      
      if(ubicacion_ped){
      	var records_location = record.load({
          type: record.Type.LOCATION,
          id: ubicacion_ped,
          isDYnamic: true,
        });
      var direccion_location = records_location.getValue('mainaddress_text') || '';
      }else{
        var direccion_location='';
      }

      if(employee){
        var records_employee = record.load({
            type: record.Type.EMPLOYEE, 
            id: employee,
            isDynamic: true,
        });

        var firstname = records_employee.getValue('firstname');
        var secondlame = records_employee.getValue('lastname');

        var nombre_empleado = firstname+' '+secondlame;
      }else{
        var nombre_empleado='';
      }


//buscar datos de subsidiaria
        var subsidiary_record = record.load({
            type: record.Type.SUBSIDIARY, 
            id: subsidiaria,
            isDynamic: true,
        });

        var subsidiary_rfc = subsidiary_record.getValue('federalidnumber');
        var subsidiary_adress = subsidiary_record.getValue('mainaddress_text');
        var subsidiary_phone = subsidiary_record.getValue('phone') || '5482 5260';
        var subsidiary_name = subsidiary_record.getValue('name');
        var subsidiary_logo_url = subsidiary_record.getValue('logo');
        if(subsidiary_logo_url){
            var file_logo = file.load({id: subsidiary_logo_url});
            var subsidiary_logo = file_logo.url;
        }else{
            var subsidiary_logo = '';
        }
        
//obtener datos de la solicitud de compra
        var solped = records.getSublistValue({
            sublistId: 'item',
            fieldId: 'linkedorder',
            line: 0
        });
        log.audit({title:'solped',details:solped});
        var empleado='';
        if(solped[0]){
            log.audit({title:'enter',details:'entró'});
            var solicitud = record.load({
                type: record.Type.PURCHASE_REQUISITION,
                id:solped[0],
                isDynamic: true,
            });
            var solicitante = solicitud.getValue('entity');
            //obtener datos del solicitante
        

        empleado = record.load({
            type: record.Type.EMPLOYEE,
            id: solicitante,
            isDynamic: true,
        });
        }
        

//obtener datos del contacto del proveedor
        var contactos = search.create({
            type: search.Type.CONTACT,
            filters: [['company',search.Operator.IS,proveedor]
            ,'and',
            ['role',search.Operator.IS,'-10']],
            columns:[
                search.createColumn({name: 'email'}),
                search.createColumn({name: 'firstname'})
            ]
        });
        var ejecutar = contactos.run();
        var resultado = ejecutar.getRange(0,100);
        log.audit({title:'rol: ',details: resultado});
//Obtener datos del proveedor
        var proveedor_data = record.load({
            type: record.Type.VENDOR,
            id: proveedor,
            isDynamic: true
        });

        var texto_a = '';
        var texto_b = '';
        var nombre_proveedor = '';
        var isperson = proveedor_data.getValue('isperson');
        if(isperson=='T'){
            nombre_proveedor = proveedor_data.getValue('glommedname');
            texto_a = ' Que es una persona física con actividad empresarial.';
            texto_b = ' Que goza de capacidad suficiente para celebrar la presente OC.';
        }

        if(isperson=='F'){
            nombre_proveedor = proveedor_data.getValue('companyname');
            texto_a = ' Que su representada es una sociedad mercantil legalmente constituida de conformidad con las leyes de la República Mexicana.';
            texto_b = ' Que su Representante Legal tiene las facultades legales para celebrar la presente OC, y para obligar a su representada en el cumplimiento de las condiciones que el se estipulan.';
        }
//obtener datos de los hitos de pago
        var hitos = search.create({
            type: 'customrecord_csc_hito_pago',
            filters: [['custrecord_csc_transaccion',search.Operator.IS,id]],
            columns:[
                search.createColumn({name: 'custrecord_csc_descripcion_hito'}),
                search.createColumn({name: 'custrecord_csc_importe'}),
                search.createColumn({name: 'custrecord_csc_termino_pago'})
            ]
        });
        var ejecutar_hitos = hitos.run();
        var resultado_hitos = ejecutar_hitos.getRange(0,100);

        //Obtener fechas
        var fecha_emision = new Date();
        fecha_emision = records.getValue('trandate');
        if(fecha_emision){
            var date_emision = fecha_emision.getDate() +'/' + fecha_emision.getMonth()+'/'+fecha_emision.getFullYear();
        }else{
            var date_emision = fecha_emision;
        }
        
        
        var fecha_entrega = records.getValue('duedate');
        if(fecha_entrega){
            var date_entrega = fecha_entrega.getDate() +'/' + fecha_entrega.getMonth()+'/'+fecha_entrega.getFullYear();
        }else{
            var date_entrega = fecha_entrega;
        }
        
        


        var datosJson = new Object();
        datosJson.id = id;
        datosJson.vendor_email = records.getValue('custbody_nsts_vp_vendor_email') || '';
        datosJson.fecha_emision = date_emision;
        datosJson.fecha_entrega = date_entrega;
        datosJson.num_pedido = records.getValue('tranid') || '';
        datosJson.memo = records.getValue('memo') || '';
        datosJson.razon_social = nombre_proveedor || '';
        datosJson.billadress = records.getValue('billaddress') || '';
        datosJson.direccion_entrega = records.getValue('custbody_csc_direccionentregadif') || '';
        datosJson.rep_legal_subsidiary = records.getValue('custbody_efx_replegal_subsidiary') || '';
        datosJson.rep_legal_vendor = proveedor_data.getValue('custentity_efx_replegal') || '';
        datosJson.texto_a = texto_a;
        datosJson.texto_b = texto_b;
        datosJson.comprador = nombre_empleado;
        datosJson.metodo_pago = records.getText('custbody_ix_ge_metod_pago') || '';
      if(datosJson.direccion_entrega ==''){
        datosJson.direccion_entrega = direccion_location || '';
      }
      	
        datosJson.terminos = records.getText('terms');
        datosJson.incoterm = records.getText('incoterm');
        if(solped[0]){
        datosJson.email_solicitante = empleado.getValue('email') || '';
        datosJson.rep_legal = empleado.getValue('altname') || '';
        }else{
            datosJson.email_solicitante = nombre_empleado;
        }
        if(resultado[0]){
            datosJson.email_contacto_principal = resultado[0].getValue({name: 'email'}) || '';
            datosJson.rep_legal = resultado[0].getValue({name: 'firstname'}) || '';
        }else{
            datosJson.email_contacto_principal = '';
        datosJson.rep_legal = '';
        }
        
        datosJson.mail_vendor = proveedor_data.getValue('email') || '';
        datosJson.telefono_vendor = proveedor_data.getValue('phone') || '';
        datosJson.rfc_vendor = proveedor_data.getValue('vatregnumber') || '';
        datosJson.subsidiaria = subsidiary_name;
        datosJson.subsidiaria_adress = subsidiary_adress;
        datosJson.subsidiaria_rfc = subsidiary_rfc;
        datosJson.subsidiaria_phone = subsidiary_phone;
        datosJson.subsidiaria_logo = subsidiary_logo;
        datosJson.proveedor = proveedor;
        datosJson.empleado = employee;
        datosJson.total = total;
        datosJson.subtotal = subtotal;
        datosJson.taxtotal = taxtotal;
        datosJson.currency = currency;
        datosJson.linkedorder = solped;
        datosJson.items = [];
        datosJson.hitos = [];

        var objItem = {};
            objItem.index = '<b style="color:#001a70;font-size:12pt">N°</b>';
            objItem.item = 'DESCRIPCIÓN DE BIENES Y SERVICIOS';
            objItem.mpn = '<b style="color:#001a70;font-size:12pt">NUMERO DE PARTE</b>';
            objItem.quantity = '<b style="color:#001a70;font-size:12pt;">CANTIDAD</b>';
            objItem.units= '<b style="color:#001a70;font-size:12pt">UNIDAD DE MEDIDA</b>';
            objItem.rate = '<b style="color:#001a70;font-size:12pt">PRECIO UNITARIO</b>';
            objItem.amount = '<b style="color:#001a70;font-size:12pt">IMPORTE</b>';

        
        datosJson.items.push(objItem);
        
        for(var i=0;i<counts;i++){

            objItem = {};
            objItem.index = i+1;

            objItem.item_value = records.getSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                line: i
            });

            try{
                var item_mpn = record.load({
                    type: record.Type.INVENTORY_ITEM, 
                    id: objItem.item_value,
                    isDynamic: true,
                });

                objItem.mpn = item_mpn.getValue('mpn');
            }catch (err){
                var item_mpn = record.load({
                    type: record.Type.NON_INVENTORY_ITEM, 
                    id: objItem.item_value,
                    isDynamic: true,
                });

                objItem.mpn = '';
            }
            
            if(!objItem.mpn){
                objItem.mpn = '';
            }

            objItem.item_name = records.getSublistText({
                sublistId: 'item',
                fieldId: 'item',
                line: i
            });

            objItem.description = records.getSublistText({
                sublistId: 'item',
                fieldId: 'description',
                line: i
            });


            objItem.units = records.getSublistText({
                sublistId: 'item',
                fieldId: 'units',
                line: i
            });
            objItem.quantity = records.getSublistValue({
                sublistId: 'item',
                fieldId: 'quantity',
                line: i
            });
            objItem.rate = records.getSublistValue({
                sublistId: 'item',
                fieldId: 'rate',
                line: i
            });
            objItem.amount = records.getSublistValue({
                sublistId: 'item',
                fieldId: 'amount',
                line: i
            });
            datosJson.items.push(objItem);
        }


//llenar hitos de facturacion
    var objHitos = {};
    objHitos.linea =0;
    objHitos.descripcion_hito = '<b style="color:#001a70;font-size:12pt">Descripción del Hito</b>';
    objHitos.importe_hito = '<b style="color:#001a70;font-size:12pt">Importe</b>';
    objHitos.terminos_hito = '<b style="color:#001a70;font-size:12pt">Terminos</b>';
    datosJson.hitos.push(objHitos);

        for(var x=0;x<resultado_hitos.length;x++){
            var objHitos = {};

            objHitos.descripcion_hito = resultado_hitos[x].getValue({name: 'custrecord_csc_descripcion_hito'});
            objHitos.importe_hito = resultado_hitos[x].getValue({name: 'custrecord_csc_importe'});
            objHitos.terminos_hito = resultado_hitos[x].getText({name: 'custrecord_csc_termino_pago'});
            datosJson.hitos.push(objHitos);
        }


        var arrayPdf = [];
        arrayPdf.push(datosJson);

        log.audit({title:'JSON',details:datosJson});
        log.audit({title:'ARRAY JSON',details:arrayPdf});


//render


        var render_pdf = render.create();
        
        render_pdf.setTemplateById(118);
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
