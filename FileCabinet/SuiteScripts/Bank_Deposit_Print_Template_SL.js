/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define(["N/search", "N/ui/serverWidget", "N/record", "N/log", "N/format", "N/format/i18n", "N/render", "N/url", "N/file"],
    function (search, serverWidget, record, log, format, i18n, render, url, file) {

        var glbForm;
        var glbRecId;
        var glbCurRecord;
        var glbSublistId;
  var glbPdfData = new Object();

        glbPdfData = {};

        function onRequest(context) {
            try {

                glbForm = serverWidget.createForm({
                    title: 'Impresión de Depósito '
                });

                // log.audit({
                //     title: 'Parámetros',
                //     details: context.request.parameters
                // });

                if (context.request.parameters.recId) {

                    glbRecId = context.request.parameters.recId;

                    glbCurRecord = record.load({
                        type: 'deposit',
                        id: glbRecId,
                        isDynamic: true
                    });

                    var existPayment = false;

                    existPayment = getPayment();

                    glbSublistId = (existPayment) ? 'payment' : 'other';

                    log.error({
                        title: 'glbSublistId',
                        details: glbSublistId
                    });

                    // Datos de customer

                    var entity = glbCurRecord.getSublistValue({
                        sublistId: glbSublistId,
                        fieldId: 'entity',
                        line: 0
                    });

                    log.audit({title: 'entidad-detalle', details: entity});
                  if(entity){
                    var recCustomer = getCustomer(entity);
                  }else{
                    var recCustomer='';
                  }
                    log.audit({title: 'record', details: recCustomer.values});
                     // Record de customer

                    var currency = glbCurRecord.getValue({
                        fieldId: 'currency'
                    });

                    var subsidiary = recCustomer.values.getValue({
                        fieldId: 'subsidiary'
                    });

                    var recSubsidiary = getSubsidiary(subsidiary);

                    var subLogo = recSubsidiary.values.getValue({
                        fieldId: 'logo'
                    });

                    var lookUp = search.lookupFields({
                        type: search.Type.CURRENCY,
                        id: currency,
                        columns: ['symbol']
                    });
                  if(subLogo){
                    var logotipo = getImageURL(subLogo);
                  }else{
                    var logotipo ='';
                  }

                  var nombre_entidad = [];
                  var tipo_tr = recCustomer.values.getValue('type');
                  var cuentaEntidad = [];
                  var numero_direccion_vendor = [];
                  var banco_entidad = [];



                    if(tipo_tr=='employee' || tipo_tr=='customer') {

                        try{
                            var first = recCustomer.values.getValue('firstname') || '';
                            var second = recCustomer.values.getValue('lastname') || '';

                            nombre_entidad[0] = first+' '+second;
                        }catch(e){
                            nombre_entidad[0] = recCustomer.values.getValue('companyname');
                        }
                        cuentaEntidad[0] = recCustomer.values.getValue('custentity_effx_cuenta_bancaria_1');
                        banco_entidad[0] = recCustomer.values.getText('custentity_effx_bancos');
                        numero_direccion_vendor[0] = recCustomer.values.getValue('defaultaddress');
                    }

                    if(tipo_tr=='vendor'){
                        var bank_info = search.create({
                            type: 'customrecord_psg_mx_bank_info',
                            filters:[['custrecord_psg_mx_bank_info_entity',search.Operator.IS,entity]],
                            columns:[
                                search.createColumn({name: 'name'}),
                                search.createColumn({name: 'custrecord_psg_mx_acct_num'}),
                                search.createColumn({name: 'custrecord_psg_mx_bank_name'}),
                            ]
                        });

                        var cuenta_entity = record.load({
                            type: record.Type.VENDOR,
                            id: entity,
                            isDynamic: true
                        });

                        var ejecutar_bank = bank_info.run();
                        var resultado_bank = ejecutar_bank.getRange(0,100);
                        var numero_cuenta_vendor = [];
                        var nombre_banco_vendor = [];
                        try{
                            var nombre_vendor = cuenta_entity.getValue('companyname');
                            nombre_entidad[0]=nombre_vendor;
                        }catch(e){
                            var first_n = cuenta_entity.getValue('firstname');
                            var second_n = cuenta_entity.getValue('lastname');
                            nombre_entidad[0]=first_n+' '+second_n;
                        }



                        numero_direccion_vendor[0]=cuenta_entity.getValue('defaultaddress');

                        log.audit({title: 'entidad', details: numero_direccion_vendor[0]});

                        for(var i=0;i<resultado_bank.length;i++){
                            numero_cuenta_vendor[i]=resultado_bank[i].getValue({name: 'custrecord_psg_mx_acct_num'});
                            nombre_banco_vendor[i]=resultado_bank[i].getValue({name: 'custrecord_psg_mx_bank_name'});

                        }
                        cuentaEntidad[0] = numero_cuenta_vendor[0];
                        banco_entidad[0] = nombre_banco_vendor[0];
                    }

                    var subsidiaria_id = glbCurRecord.getValue('subsidiary');
                    var cuenta_id = glbCurRecord.getValue('account');

                    var subsidiaria_record = record.load({
                        type: record.Type.SUBSIDIARY,
                        id: subsidiaria_id,
                        isDynamic: true
                    });

                    var subsidiaria_address = subsidiaria_record.getValue('mainaddress_text');

                    var cuenta_bancaria_carga = record.load({
                        type: record.Type.ACCOUNT,
                        id: cuenta_id,
                        isDynamic: true
                    });


                    var cuenta_bancaria = cuenta_bancaria_carga.getValue('custrecord_csc_cuenta_clabe');
                    var nombre_banco = cuenta_bancaria_carga.getValue('custrecord_efx_fe_banco');
                    var nombre_banco_text = cuenta_bancaria_carga.getText('custrecord_efx_fe_banco');
                    try{
                        var monto_decimal = glbCurRecord.getValue('total').toString();
                        log.audit({title: 'montodecimal', details: monto_decimal});
                        
                        var monto_decimal_cut = monto_decimal.split('.');
                        log.audit({title: 'monto_decimal_cut', details: monto_decimal_cut});
                        if(monto_decimal_cut[1]){
                            monto_decimal_cut[1]='';
                        }else{
                            monto_decimal_cut[1]='.00';
                        }
                        log.audit({title: 'monto 0', details: monto_decimal_cut[0]});
                        log.audit({title: 'monto 1', details: monto_decimal_cut[1]});

                    }catch(e){

                    }

                  

                    glbPdfData['data'] = {
                        folio: glbCurRecord.getValue({
                            fieldId: 'id'
                        }),
                        fecha: formatDate(glbCurRecord.getValue({
                            fieldId: 'trandate'
                        })),
                        empresaRecibe: nombre_entidad[0],

                        empresaRecibeCuenta: cuentaEntidad[0],

                        empresaRecibeBanco: banco_entidad[0],

                        direccion: numero_direccion_vendor[0] || 'Sin dirección',

                        depositante: glbCurRecord.getText({
                            fieldId: 'subsidiary'
                        }),

                        depositanteAddress: subsidiaria_address,
                        banco: nombre_banco_text,
                        cuenta: cuenta_bancaria,
                        concepto: glbCurRecord.getValue('memo'),
                        monto: glbCurRecord.getValue('total'),
                        monto_t: '$'+glbCurRecord.getValue('total')+monto_decimal_cut[1],
                        montoLetra: '',
                        tituloFormato: 'Formato de Depósito',
                      
                        logo: logotipo
                    };

                    glbPdfData.data.montoLetra = getMontoLetra(glbPdfData.data.monto, lookUp.symbol).toUpperCase();

       

                    var templateFile = renderizarPDF();
                  log.audit({title:'render2',details: templateFile});

                    context.response.writeFile({
                        file: templateFile,
                        isInline: true
                    });

                } else {
                    log.error({
                        title: 'onRequest - error',
                        details: 'No se recibió ID del depósito'
                    });
                }

            } catch (e) {
                log.error({
                    title: 'onRequest - error',
                    details: JSON.stringify(e)
                });
            }
        }

        function getPayment() {
            var subListId = '';

            try {

                subListId = glbCurRecord.getSublistValue({
                    sublistId: 'payment',
                    fieldId: 'amount',
                    line: 0
                });

                if (subListId) {
                    return true;
                }

            } catch (e) {
                log.error({
                    title: 'getPayment',
                    details: e
                });

                return false;
            }
        }

        function getCustomer(recId) {
          
          var tipo = search.create({
            type: search.Type.ENTITY,
            filters: [['internalid',search.Operator.IS,recId]],
            columns:[
              search.createColumn({name:'type'})
            ]
          });
          var ejecutar = tipo.run();
          var resultados = ejecutar.getRange(0,100);
          
          var tipo_tran = resultados[0].getValue({name: 'type'});
          var tipo_search ='';

          if(tipo_tran=='CustJob'){
                
                tipo_search=record.Type.CUSTOMER;
            }
          if(tipo_tran=='Employee'){
                
                tipo_search=record.Type.EMPLOYEE;
            }
          if(tipo_tran=='Vendor'){
                
                tipo_search=record.Type.VENDOR;
            }

            var recCustomer = record.load({
                type: tipo_search,
                id: recId,
                isDynamic: true
            });

            return {result: true, values: recCustomer};
        }

        function getSubsidiary(recId) {
            var recSubsidiary = record.load({
                type: 'subsidiary',
                id: recId,
                isDynamic: true
            });

            return {result: true, values: recSubsidiary};
        }

        function getImageURL(imageId) {
            try {
                var logoFile = file.load({
                    id: imageId
                });

                var logoURL = logoFile.url;
                var scheme = 'https://';
                var host = url.resolveDomain({
                    hostType: url.HostType.APPLICATION
                });

                var urlFinal = scheme + host + logoURL;
                log.audit({title: 'urlFinal', details: urlFinal});

                var remplaceUrl = urlFinal.toString().replace("&", "&amp;");
                log.audit({title: 'urlFinal replace &', details: remplaceUrl});
                return remplaceUrl;
            } catch (e) {
                log.error({
                    title: 'Error getImageURL',
                    details: e
                })
            }
        }

        function getMontoLetra(dato, symbol) {

            var spellOut = i18n.spellOut({
                number: dato,
                locale: "ES"
            });

            var monto = dato.toString().split('.');

            if (monto[1] == undefined) {
                monto[1] = "00";
            }

            var texto = spellOut.split(" coma");
            var traduccion = texto[0] + " " + monto[1] + "/100 " + symbol;
            log.audit({title: 'letra:', details: traduccion});

            return traduccion;
        }

        // function getMontoLetra(number, lenguaje) {
        //     var spellOut = i18n.spellOut({
        //         number: number,
        //         locale: lenguaje
        //     });
        //
        //     log.debug(spellOut);
        //
        //     var texto = spellOut.split(" coma");
        //
        //     var traduccion = texto[0] + ' ' + texto[1] + "/100 ";
        //
        //     return traduccion;
        // }

        function formatDate(value) {

            var date = new Date(format.parse({value: value, type: format.Type.DATE}));

            var meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

            var date2 = date.getDate() + ' de ' + meses[date.getMonth()] + ' ' + date.getFullYear();

            return date2;
        }

        function renderizarPDF() {

            

        try {
          log.audit({
                    title: 'Renderizar Pdf con datos',
                    details: glbPdfData
                });

          var render_pdf = render.create();
          var transactionFileTemplate = null;
        
        render_pdf.setTemplateById(144);

        var transactionFile = null;

        render_pdf.addCustomDataSource({ format: render.DataSource.OBJECT, alias: "DATA", data: glbPdfData});

 
       

          return render_pdf.renderAsPdf();
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
