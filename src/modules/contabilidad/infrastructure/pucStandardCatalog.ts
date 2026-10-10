import type { PucAccount } from '../domain/pucTypes';

export const STANDARD_PUC_CATALOG: PucAccount[] = [
  // ==========================================
  // CLASE 1: ACTIVO
  // ==========================================
  { id: 'acc-1', code: '1', name: 'ACTIVO', level: 1, nature: 'DEBIT', isActive: true },

  // Grupo 11: DISPONIBLE
  { id: 'acc-11', code: '11', name: 'DISPONIBLE', level: 2, nature: 'DEBIT', parentCode: '1', isActive: true },
  
  // Cuenta 1105: Caja
  { id: 'acc-1105', code: '1105', name: 'Caja', level: 3, nature: 'DEBIT', parentCode: '11', isActive: true },
  { id: 'acc-110505', code: '110505', name: 'Caja general', level: 4, nature: 'DEBIT', parentCode: '1105', isActive: true },
  { id: 'acc-11050501', code: '11050501', name: 'CAJA GENERAL PRINCIPAL', level: 5, nature: 'DEBIT', parentCode: '110505', isActive: false },
  { id: 'acc-11050502', code: '11050502', name: 'CAJA DE RECAUDOS EN EFECTIVO', level: 5, nature: 'DEBIT', parentCode: '110505', isActive: false },
  { id: 'acc-11050503', code: '11050503', name: 'CAJA PAGADORA Y DESEMBOLSOS', level: 5, nature: 'DEBIT', parentCode: '110505', isActive: false },
  { id: 'acc-11050504', code: '11050504', name: 'CAJA AUXILIAR DE TESORERÍA', level: 5, nature: 'DEBIT', parentCode: '110505', isActive: false },
  { id: 'acc-11050505', code: '11050505', name: 'CAJA SEDE SECUNDARIA', level: 5, nature: 'DEBIT', parentCode: '110505', isActive: false },
  { id: 'acc-110510', code: '110510', name: 'Cajas menores', level: 4, nature: 'DEBIT', parentCode: '1105', isActive: false },
  { id: 'acc-11051001', code: '11051001', name: 'CAJA MENOR ADMINISTRACIÓN', level: 5, nature: 'DEBIT', parentCode: '110510', isActive: false },
  { id: 'acc-11051002', code: '11051002', name: 'CAJA MENOR OPERATIVA', level: 5, nature: 'DEBIT', parentCode: '110510', isActive: false },
  { id: 'acc-110515', code: '110515', name: 'Moneda extranjera', level: 4, nature: 'DEBIT', parentCode: '1105', isActive: false },

  // Cuenta 1110: Bancos
  { id: 'acc-1110', code: '1110', name: 'Bancos', level: 3, nature: 'DEBIT', parentCode: '11', isActive: true },
  { id: 'acc-111005', code: '111005', name: 'Moneda nacional', level: 4, nature: 'DEBIT', parentCode: '1110', isActive: true },
  { id: 'acc-11100501', code: '11100501', name: 'BANCOLOMBIA CUENTA DE AHORROS', level: 5, nature: 'DEBIT', parentCode: '111005', isActive: true, isCustom: true },
  { id: 'acc-11100502', code: '11100502', name: 'BANCO DE BOGOTA CUENTA CORRIENTE', level: 5, nature: 'DEBIT', parentCode: '111005', isActive: false, isCustom: true },
  { id: 'acc-11100503', code: '11100503', name: 'DAVIVIENDA CUENTA DE AHORROS', level: 5, nature: 'DEBIT', parentCode: '111005', isActive: false, isCustom: true },
  { id: 'acc-11100504', code: '11100504', name: 'BANCO AGRARIO DE COLOMBIA', level: 5, nature: 'DEBIT', parentCode: '111005', isActive: false },
  { id: 'acc-11100505', code: '11100505', name: 'BANCO DE OCCIDENTE', level: 5, nature: 'DEBIT', parentCode: '111005', isActive: false },
  { id: 'acc-11100506', code: '11100506', name: 'BANCO POPULAR', level: 5, nature: 'DEBIT', parentCode: '111005', isActive: false },
  { id: 'acc-11100507', code: '11100507', name: 'BANCO AV VILLAS', level: 5, nature: 'DEBIT', parentCode: '111005', isActive: false },
  { id: 'acc-11100508', code: '11100508', name: 'NEQUI EMPRESARIAL / INSTITUCIONAL', level: 5, nature: 'DEBIT', parentCode: '111005', isActive: false },
  { id: 'acc-11100509', code: '11100509', name: 'DAVIPLATA EMPRESARIAL', level: 5, nature: 'DEBIT', parentCode: '111005', isActive: false },
  { id: 'acc-11100510', code: '11100510', name: 'BANCO BBVA COLOMBIA', level: 5, nature: 'DEBIT', parentCode: '111005', isActive: false },
  { id: 'acc-11100511', code: '11100511', name: 'BANCO CAJA SOCIAL', level: 5, nature: 'DEBIT', parentCode: '111005', isActive: false },
  { id: 'acc-111010', code: '111010', name: 'Moneda extranjera', level: 4, nature: 'DEBIT', parentCode: '1110', isActive: false },
  { id: 'acc-11101001', code: '11101001', name: 'BANCO EN DOLARES (USD)', level: 5, nature: 'DEBIT', parentCode: '111010', isActive: false },
  { id: 'acc-11101002', code: '11101002', name: 'BANCO EN EUROS (EUR)', level: 5, nature: 'DEBIT', parentCode: '111010', isActive: false },

  // Cuenta 1115 y 1120
  { id: 'acc-1115', code: '1115', name: 'Remesas en tránsito', level: 3, nature: 'DEBIT', parentCode: '11', isActive: false },
  { id: 'acc-1120', code: '1120', name: 'Cuentas de ahorro', level: 3, nature: 'DEBIT', parentCode: '11', isActive: false },
  { id: 'acc-1125', code: '1125', name: 'Fondos', level: 3, nature: 'DEBIT', parentCode: '11', isActive: false },

  // Grupo 12: INVERSIONES
  { id: 'acc-12', code: '12', name: 'INVERSIONES', level: 2, nature: 'DEBIT', parentCode: '1', isActive: false },
  { id: 'acc-1205', code: '1205', name: 'Acciones', level: 3, nature: 'DEBIT', parentCode: '12', isActive: false },
  { id: 'acc-1215', code: '1215', name: 'Bonos', level: 3, nature: 'DEBIT', parentCode: '12', isActive: false },
  { id: 'acc-1225', code: '1225', name: 'Certificados (CDT)', level: 3, nature: 'DEBIT', parentCode: '12', isActive: false },

  // Grupo 13: DEUDORES
  { id: 'acc-13', code: '13', name: 'DEUDORES (CARTERA)', level: 2, nature: 'DEBIT', parentCode: '1', isActive: true },
  { id: 'acc-1305', code: '1305', name: 'Clientes', level: 3, nature: 'DEBIT', parentCode: '13', isActive: false, requiresThirdParty: true },
  { id: 'acc-130505', code: '130505', name: 'Clientes nacionales', level: 4, nature: 'DEBIT', parentCode: '1305', isActive: false, requiresThirdParty: true },
  { id: 'acc-130510', code: '130510', name: 'Clientes del exterior', level: 4, nature: 'DEBIT', parentCode: '1305', isActive: false, requiresThirdParty: true },
  { id: 'acc-1325', code: '1325', name: 'Cuentas por cobrar a socios y accionistas', level: 3, nature: 'DEBIT', parentCode: '13', isActive: false, requiresThirdParty: true },
  { id: 'acc-1330', code: '1330', name: 'Anticipos y avances', level: 3, nature: 'DEBIT', parentCode: '13', isActive: false, requiresThirdParty: true },
  { id: 'acc-1365', code: '1365', name: 'Cuentas por cobrar a asociados (Préstamos)', level: 3, nature: 'DEBIT', parentCode: '13', isActive: true, requiresThirdParty: true },
  { id: 'acc-136505', code: '136505', name: 'Préstamos a asociados (Cartera de créditos)', level: 4, nature: 'DEBIT', parentCode: '1365', isActive: true, requiresThirdParty: true },
  { id: 'acc-136515', code: '136515', name: 'Créditos de libre inversión', level: 4, nature: 'DEBIT', parentCode: '1365', isActive: false, requiresThirdParty: true },
  { id: 'acc-136525', code: '136525', name: 'Créditos para vivienda y reformas', level: 4, nature: 'DEBIT', parentCode: '1365', isActive: false, requiresThirdParty: true },
  { id: 'acc-136530', code: '136530', name: 'Créditos educativos y bienestar social', level: 4, nature: 'DEBIT', parentCode: '1365', isActive: false, requiresThirdParty: true },
  { id: 'acc-136595', code: '136595', name: 'Otros préstamos a asociados', level: 4, nature: 'DEBIT', parentCode: '1365', isActive: false, requiresThirdParty: true },
  { id: 'acc-1355', code: '1355', name: 'Anticipo de impuestos y contribuciones', level: 3, nature: 'DEBIT', parentCode: '13', isActive: false },
  { id: 'acc-135515', code: '135515', name: 'Retención en la fuente', level: 4, nature: 'DEBIT', parentCode: '1355', isActive: false },
  { id: 'acc-135517', code: '135517', name: 'Impuesto a las ventas retenido (ReteIVA)', level: 4, nature: 'DEBIT', parentCode: '1355', isActive: false },
  { id: 'acc-135518', code: '135518', name: 'Impuesto de industria y comercio retenido (ReteICA)', level: 4, nature: 'DEBIT', parentCode: '1355', isActive: false },

  // Grupo 14: INVENTARIOS
  { id: 'acc-14', code: '14', name: 'INVENTARIOS', level: 2, nature: 'DEBIT', parentCode: '1', isActive: false },
  { id: 'acc-1435', code: '1435', name: 'Mercancías no fabricadas por la empresa', level: 3, nature: 'DEBIT', parentCode: '14', isActive: false },
  { id: 'acc-143505', code: '143505', name: 'Mercancías generales', level: 4, nature: 'DEBIT', parentCode: '1435', isActive: false },

  // Grupo 15: PROPIEDADES, PLANTA Y EQUIPO
  { id: 'acc-15', code: '15', name: 'PROPIEDADES, PLANTA Y EQUIPO', level: 2, nature: 'DEBIT', parentCode: '1', isActive: false },
  { id: 'acc-1504', code: '1504', name: 'Terrenos', level: 3, nature: 'DEBIT', parentCode: '15', isActive: false },
  { id: 'acc-1516', code: '1516', name: 'Construcciones y edificaciones', level: 3, nature: 'DEBIT', parentCode: '15', isActive: false },
  { id: 'acc-1524', code: '1524', name: 'Equipo de oficina', level: 3, nature: 'DEBIT', parentCode: '15', isActive: false },
  { id: 'acc-1528', code: '1528', name: 'Equipo de computación y comunicación', level: 3, nature: 'DEBIT', parentCode: '15', isActive: false },
  { id: 'acc-1540', code: '1540', name: 'Flota y equipo de transporte', level: 3, nature: 'DEBIT', parentCode: '15', isActive: false },
  { id: 'acc-1592', code: '1592', name: 'Depreciación acumulada', level: 3, nature: 'CREDIT', parentCode: '15', isActive: false },

  // ==========================================
  // CLASE 2: PASIVO
  // ==========================================
  { id: 'acc-2', code: '2', name: 'PASIVO', level: 1, nature: 'CREDIT', isActive: true },

  // Grupo 21: OBLIGACIONES FINANCIERAS
  { id: 'acc-21', code: '21', name: 'OBLIGACIONES FINANCIERAS', level: 2, nature: 'CREDIT', parentCode: '2', isActive: false },
  { id: 'acc-2105', code: '2105', name: 'Bancos nacionales', level: 3, nature: 'CREDIT', parentCode: '21', isActive: false },

  // Grupo 22: PROVEEDORES
  { id: 'acc-22', code: '22', name: 'PROVEEDORES', level: 2, nature: 'CREDIT', parentCode: '2', isActive: false },
  { id: 'acc-2205', code: '2205', name: 'Nacionales', level: 3, nature: 'CREDIT', parentCode: '22', isActive: false, requiresThirdParty: true },
  { id: 'acc-220505', code: '220505', name: 'Proveedores nacionales', level: 4, nature: 'CREDIT', parentCode: '2205', isActive: false, requiresThirdParty: true },

  // Grupo 23: CUENTAS POR PAGAR
  { id: 'acc-23', code: '23', name: 'CUENTAS POR PAGAR', level: 2, nature: 'CREDIT', parentCode: '2', isActive: true },
  { id: 'acc-2335', code: '2335', name: 'Costos y gastos por pagar', level: 3, nature: 'CREDIT', parentCode: '23', isActive: false, requiresThirdParty: true },
  { id: 'acc-2365', code: '2365', name: 'Retención en la fuente', level: 3, nature: 'CREDIT', parentCode: '23', isActive: false },
  { id: 'acc-236540', code: '236540', name: 'Retención en compras', level: 4, nature: 'CREDIT', parentCode: '2365', isActive: false },
  { id: 'acc-236525', code: '236525', name: 'Retención en servicios', level: 4, nature: 'CREDIT', parentCode: '2365', isActive: false },
  { id: 'acc-236515', code: '236515', name: 'Retención en honorarios', level: 4, nature: 'CREDIT', parentCode: '2365', isActive: false },
  { id: 'acc-2368', code: '2368', name: 'Impuesto de industria y comercio retenido', level: 3, nature: 'CREDIT', parentCode: '23', isActive: false },
  { id: 'acc-236805', code: '236805', name: 'ReteICA por pagar', level: 4, nature: 'CREDIT', parentCode: '2368', isActive: false },
  { id: 'acc-2380', code: '2380', name: 'Acreedores varios y fondos sociales', level: 3, nature: 'CREDIT', parentCode: '23', isActive: true },
  { id: 'acc-238020', code: '238020', name: 'Fondo de destinación específica', level: 4, nature: 'CREDIT', parentCode: '2380', isActive: true },
  { id: 'acc-238025', code: '238025', name: 'Fondo de solidaridad', level: 4, nature: 'CREDIT', parentCode: '2380', isActive: true },
  { id: 'acc-238035', code: '238035', name: 'Fondo de turismo y recreación', level: 4, nature: 'CREDIT', parentCode: '2380', isActive: true },
  { id: 'acc-238095', code: '238095', name: 'Fondos actividades especiales y bingos', level: 4, nature: 'CREDIT', parentCode: '2380', isActive: true },

  // Grupo 24: IMPUESTOS, GRAVAMENES Y TASAS
  { id: 'acc-24', code: '24', name: 'IMPUESTOS, GRAVAMENES Y TASAS', level: 2, nature: 'CREDIT', parentCode: '2', isActive: false },
  { id: 'acc-2408', code: '2408', name: 'Impuesto sobre las ventas por pagar (IVA)', level: 3, nature: 'CREDIT', parentCode: '24', isActive: false },
  { id: 'acc-240805', code: '240805', name: 'IVA generado', level: 4, nature: 'CREDIT', parentCode: '2408', isActive: false },
  { id: 'acc-240810', code: '240810', name: 'IVA descontable', level: 4, nature: 'DEBIT', parentCode: '2408', isActive: false },

  // Grupo 25: OBLIGACIONES LABORALES
  { id: 'acc-25', code: '25', name: 'OBLIGACIONES LABORALES', level: 2, nature: 'CREDIT', parentCode: '2', isActive: false },
  { id: 'acc-2505', code: '2505', name: 'Salarios por pagar', level: 3, nature: 'CREDIT', parentCode: '25', isActive: false },

  // ==========================================
  // CLASE 3: PATRIMONIO
  // ==========================================
  { id: 'acc-3', code: '3', name: 'PATRIMONIO', level: 1, nature: 'CREDIT', isActive: true },
  { id: 'acc-31', code: '31', name: 'CAPITAL SOCIAL', level: 2, nature: 'CREDIT', parentCode: '3', isActive: true },
  { id: 'acc-3105', code: '3105', name: 'Capital suscrito y pagado', level: 3, nature: 'CREDIT', parentCode: '31', isActive: false },
  { id: 'acc-3115', code: '3115', name: 'Aportes sociales (Cooperativas y Asociaciones)', level: 3, nature: 'CREDIT', parentCode: '31', isActive: true },
  { id: 'acc-311505', code: '311505', name: 'Aportes sociales ordinarios', level: 4, nature: 'CREDIT', parentCode: '3115', isActive: true, requiresThirdParty: true },
  { id: 'acc-311510', code: '311510', name: 'Aportes extraordinarios', level: 4, nature: 'CREDIT', parentCode: '3115', isActive: false, requiresThirdParty: true },
  { id: 'acc-33', code: '33', name: 'RESERVAS', level: 2, nature: 'CREDIT', parentCode: '3', isActive: false },
  { id: 'acc-36', code: '36', name: 'RESULTADOS DEL EJERCICIO', level: 2, nature: 'CREDIT', parentCode: '3', isActive: false },
  { id: 'acc-3605', code: '3605', name: 'Utilidad del ejercicio', level: 3, nature: 'CREDIT', parentCode: '36', isActive: false },
  { id: 'acc-3610', code: '3610', name: 'Pérdida del ejercicio', level: 3, nature: 'DEBIT', parentCode: '36', isActive: false },

  // ==========================================
  // CLASE 4: INGRESOS
  // ==========================================
  { id: 'acc-4', code: '4', name: 'INGRESOS', level: 1, nature: 'CREDIT', isActive: true },
  { id: 'acc-41', code: '41', name: 'OPERACIONALES', level: 2, nature: 'CREDIT', parentCode: '4', isActive: true },
  { id: 'acc-4135', code: '4135', name: 'Comercio al por mayor y al por menor', level: 3, nature: 'CREDIT', parentCode: '41', isActive: false },
  { id: 'acc-413505', code: '413505', name: 'Venta de mercancías', level: 4, nature: 'CREDIT', parentCode: '4135', isActive: false },
  { id: 'acc-4170', code: '4170', name: 'Otras actividades de servicios comunitarios y sociales', level: 3, nature: 'CREDIT', parentCode: '41', isActive: true },
  { id: 'acc-417010', code: '417010', name: 'Cuotas de administración y sostenimiento', level: 4, nature: 'CREDIT', parentCode: '4170', isActive: true },
  { id: 'acc-42', code: '42', name: 'NO OPERACIONALES', level: 2, nature: 'CREDIT', parentCode: '4', isActive: true },
  { id: 'acc-4210', code: '4210', name: 'Financieros', level: 3, nature: 'CREDIT', parentCode: '42', isActive: true },
  { id: 'acc-421005', code: '421005', name: 'Intereses sobre préstamos a asociados', level: 4, nature: 'CREDIT', parentCode: '4210', isActive: true },
  { id: 'acc-4295', code: '4295', name: 'Diversos', level: 3, nature: 'CREDIT', parentCode: '42', isActive: true },
  { id: 'acc-429581', code: '429581', name: 'Eventos, bingos y actividades', level: 4, nature: 'CREDIT', parentCode: '4295', isActive: true },

  // ==========================================
  // CLASE 5: GASTOS
  // ==========================================
  { id: 'acc-5', code: '5', name: 'GASTOS', level: 1, nature: 'DEBIT', isActive: false },
  { id: 'acc-51', code: '51', name: 'OPERACIONALES DE ADMINISTRACION', level: 2, nature: 'DEBIT', parentCode: '5', isActive: false },
  { id: 'acc-5105', code: '5105', name: 'Gastos de personal', level: 3, nature: 'DEBIT', parentCode: '51', isActive: false },
  { id: 'acc-510506', code: '510506', name: 'Sueldos', level: 4, nature: 'DEBIT', parentCode: '5105', isActive: false },
  { id: 'acc-510527', code: '510527', name: 'Auxilio de transporte', level: 4, nature: 'DEBIT', parentCode: '5105', isActive: false },
  { id: 'acc-5135', code: '5135', name: 'Servicios', level: 3, nature: 'DEBIT', parentCode: '51', isActive: false },
  { id: 'acc-513505', code: '513505', name: 'Aseo y vigilancia', level: 4, nature: 'DEBIT', parentCode: '5135', isActive: false },
  { id: 'acc-513535', code: '513535', name: 'Teléfono e internet', level: 4, nature: 'DEBIT', parentCode: '5135', isActive: false },
  { id: 'acc-513550', code: '513550', name: 'Transporte y fletes', level: 4, nature: 'DEBIT', parentCode: '5135', isActive: false },
  { id: 'acc-52', code: '52', name: 'OPERACIONALES DE VENTAS', level: 2, nature: 'DEBIT', parentCode: '5', isActive: false },

  // ==========================================
  // CLASE 6: COSTOS DE VENTAS
  // ==========================================
  { id: 'acc-6', code: '6', name: 'COSTOS DE VENTAS', level: 1, nature: 'DEBIT', isActive: false },
  { id: 'acc-61', code: '61', name: 'COSTO DE VENTAS Y DE PRESTACIÓN DE SERVICIOS', level: 2, nature: 'DEBIT', parentCode: '6', isActive: false },
  { id: 'acc-6135', code: '6135', name: 'Comercio al por mayor y al por menor', level: 3, nature: 'DEBIT', parentCode: '61', isActive: false },

  // ==========================================
  // CLASE 7: COSTOS DE PRODUCCION O DE OPERACION
  // ==========================================
  { id: 'acc-7', code: '7', name: 'COSTOS DE PRODUCCIÓN O DE OPERACIÓN', level: 1, nature: 'DEBIT', isActive: false },
  { id: 'acc-71', code: '71', name: 'MATERIA PRIMA', level: 2, nature: 'DEBIT', parentCode: '7', isActive: false },
  { id: 'acc-72', code: '72', name: 'MANO DE OBRA DIRECTA', level: 2, nature: 'DEBIT', parentCode: '7', isActive: false },

  // ==========================================
  // CLASE 8: CUENTAS DE ORDEN DEUDORAS
  // ==========================================
  { id: 'acc-8', code: '8', name: 'CUENTAS DE ORDEN DEUDORAS', level: 1, nature: 'DEBIT', isActive: false },
  { id: 'acc-81', code: '81', name: 'DERECHOS CONTINGENTES', level: 2, nature: 'DEBIT', parentCode: '8', isActive: false },
  { id: 'acc-83', code: '83', name: 'DEUDORAS DE CONTROL', level: 2, nature: 'DEBIT', parentCode: '8', isActive: false },

  // ==========================================
  // CLASE 9: CUENTAS DE ORDEN ACREEDORAS
  // ==========================================
  { id: 'acc-9', code: '9', name: 'CUENTAS DE ORDEN ACREEDORAS', level: 1, nature: 'CREDIT', isActive: false },
  { id: 'acc-91', code: '91', name: 'RESPONSABILIDADES CONTINGENTES', level: 2, nature: 'CREDIT', parentCode: '9', isActive: false },
  { id: 'acc-93', code: '93', name: 'ACREEDORAS DE CONTROL', level: 2, nature: 'CREDIT', parentCode: '9', isActive: false },
];

export interface PucSubaccountTemplate {
  code: string;
  name: string;
  nature?: 'DEBIT' | 'CREDIT';
  requiresThirdParty?: boolean;
}

export const OFFICIAL_PUC_SUBACCOUNTS_MAP: Record<string, PucSubaccountTemplate[]> = {
  // 110505: Caja general
  '110505': [
    { code: '11050501', name: 'CAJA GENERAL PRINCIPAL', requiresThirdParty: false },
    { code: '11050502', name: 'CAJA DE RECAUDOS EN EFECTIVO', requiresThirdParty: false },
    { code: '11050503', name: 'CAJA PAGADORA Y DESEMBOLSOS', requiresThirdParty: false },
    { code: '11050504', name: 'CAJA AUXILIAR DE TESORERÍA', requiresThirdParty: false },
    { code: '11050505', name: 'CAJA SEDE SECUNDARIA', requiresThirdParty: false },
  ],
  // 110510: Cajas menores
  '110510': [
    { code: '11051001', name: 'CAJA MENOR ADMINISTRACIÓN', requiresThirdParty: false },
    { code: '11051002', name: 'CAJA MENOR OPERACIONES Y COMPRAS', requiresThirdParty: false },
    { code: '11051003', name: 'CAJA MENOR SEDE NORTE', requiresThirdParty: false },
  ],
  // 1105: Caja (Nivel 3)
  '1105': [
    { code: '110505', name: 'Caja general', requiresThirdParty: false },
    { code: '110510', name: 'Cajas menores', requiresThirdParty: false },
    { code: '110515', name: 'Moneda extranjera', requiresThirdParty: false },
  ],
  // 111005: Bancos moneda nacional
  '111005': [
    { code: '11100501', name: 'BANCOLOMBIA CUENTA DE AHORROS', requiresThirdParty: false },
    { code: '11100502', name: 'BANCO DE BOGOTA CUENTA CORRIENTE', requiresThirdParty: false },
    { code: '11100503', name: 'DAVIVIENDA CUENTA DE AHORROS', requiresThirdParty: false },
    { code: '11100504', name: 'BANCO AGRARIO DE COLOMBIA', requiresThirdParty: false },
    { code: '11100505', name: 'BANCO DE OCCIDENTE', requiresThirdParty: false },
    { code: '11100506', name: 'BANCO POPULAR', requiresThirdParty: false },
    { code: '11100507', name: 'BANCO AV VILLAS', requiresThirdParty: false },
    { code: '11100508', name: 'NEQUI EMPRESARIAL / INSTITUCIONAL', requiresThirdParty: false },
    { code: '11100509', name: 'DAVIPLATA EMPRESARIAL', requiresThirdParty: false },
    { code: '11100510', name: 'BANCO BBVA COLOMBIA', requiresThirdParty: false },
    { code: '11100511', name: 'BANCO CAJA SOCIAL', requiresThirdParty: false },
  ],
  // 111010: Bancos moneda extranjera
  '111010': [
    { code: '11101001', name: 'BANCO MONEDA EXTRANJERA (USD)', requiresThirdParty: false },
    { code: '11101002', name: 'BANCO MONEDA EXTRANJERA (EUR)', requiresThirdParty: false },
  ],
  // 1110: Bancos (Nivel 3)
  '1110': [
    { code: '111005', name: 'Moneda nacional', requiresThirdParty: false },
    { code: '111010', name: 'Moneda extranjera', requiresThirdParty: false },
  ],
  // 130505: Clientes nacionales
  '130505': [
    { code: '13050501', name: 'CLIENTES COMERCIALES NACIONALES', requiresThirdParty: true },
    { code: '13050502', name: 'CLIENTES POR CONVENIOS Y SERVICIOS', requiresThirdParty: true },
    { code: '13050503', name: 'CLIENTES INSTITUCIONALES', requiresThirdParty: true },
  ],
  // 1305: Clientes
  '1305': [
    { code: '130505', name: 'Clientes nacionales', requiresThirdParty: true },
    { code: '130510', name: 'Clientes del exterior', requiresThirdParty: true },
  ],
  // 136505: Préstamos a asociados
  '136505': [
    { code: '13650501', name: 'CRÉDITOS DE LIBRE INVERSIÓN A ASOCIADOS', requiresThirdParty: true },
    { code: '13650502', name: 'CRÉDITOS DE EMERGENCIA Y SALUD', requiresThirdParty: true },
    { code: '13650503', name: 'CRÉDITOS PARA VIVIENDA Y REFORMAS', requiresThirdParty: true },
    { code: '13650504', name: 'CRÉDITOS EDUCATIVOS Y BIENESTAR', requiresThirdParty: true },
    { code: '13650505', name: 'MICROCRÉDITOS PRODUCTIVOS A ASOCIADOS', requiresThirdParty: true },
    { code: '13650595', name: 'OTROS PRÉSTAMOS A ASOCIADOS', requiresThirdParty: true },
  ],
  // 1365: Préstamos
  '1365': [
    { code: '136505', name: 'Préstamos a asociados (Cartera de créditos)', requiresThirdParty: true },
    { code: '136515', name: 'Créditos de libre inversión', requiresThirdParty: true },
    { code: '136525', name: 'Créditos para vivienda y reformas', requiresThirdParty: true },
    { code: '136530', name: 'Créditos educativos y bienestar social', requiresThirdParty: true },
    { code: '136595', name: 'Otros préstamos a asociados', requiresThirdParty: true },
  ],
  // 135515: Retención en la fuente a favor
  '135515': [
    { code: '13551501', name: 'RETEFUENTE POR COMPRAS (2.5% / 3.5%)', requiresThirdParty: false },
    { code: '13551502', name: 'RETEFUENTE POR SERVICIOS (4% / 6%)', requiresThirdParty: false },
    { code: '13551503', name: 'RETEFUENTE POR HONORARIOS (10% / 11%)', requiresThirdParty: false },
    { code: '13551504', name: 'RETEFUENTE POR RENDIMIENTOS FINANCIEROS', requiresThirdParty: false },
  ],
  // 220505: Proveedores nacionales
  '220505': [
    { code: '22050501', name: 'PROVEEDORES DE MERCANCÍAS Y SUMINISTROS', requiresThirdParty: true },
    { code: '22050502', name: 'PROVEEDORES DE SERVICIOS Y CONTRATISTAS', requiresThirdParty: true },
    { code: '22050503', name: 'PROVEEDORES DE TECNOLOGÍA Y ASESORÍAS', requiresThirdParty: true },
  ],
  // 2335: Costos y gastos por pagar
  '2335': [
    { code: '233525', name: 'Honorarios por pagar', requiresThirdParty: true },
    { code: '233530', name: 'Servicios técnicos por pagar', requiresThirdParty: true },
    { code: '233535', name: 'Mantenimiento y reparaciones', requiresThirdParty: true },
    { code: '233540', name: 'Arrendamientos por pagar', requiresThirdParty: true },
    { code: '233550', name: 'Servicios públicos por pagar', requiresThirdParty: true },
    { code: '233595', name: 'Otros costos y gastos por pagar', requiresThirdParty: true },
  ],
  // 2365: Retención en la fuente por pagar
  '2365': [
    { code: '236515', name: 'Retención en honorarios', requiresThirdParty: false },
    { code: '236520', name: 'Retención en comisiones', requiresThirdParty: false },
    { code: '236525', name: 'Retención en servicios', requiresThirdParty: false },
    { code: '236530', name: 'Retención en arrendamientos', requiresThirdParty: false },
    { code: '236540', name: 'Retención en compras', requiresThirdParty: false },
    { code: '236575', name: 'Autorretención especial de renta', requiresThirdParty: false },
  ],
  // 2380: Acreedores varios y fondos
  '2380': [
    { code: '238020', name: 'Fondo de destinación específica', requiresThirdParty: false },
    { code: '238025', name: 'Fondo de solidaridad', requiresThirdParty: false },
    { code: '238035', name: 'Fondo de turismo y recreación', requiresThirdParty: false },
    { code: '238095', name: 'Fondos actividades especiales y bingos', requiresThirdParty: false },
  ],
  // 238020: Fondo de destinación específica
  '238020': [
    { code: '23802001', name: 'FONDO DE DESTINACIÓN ESPECÍFICA RECAUDADO', requiresThirdParty: false },
    { code: '23802002', name: 'FONDO DE DESTINACIÓN ESPECÍFICA - DESEMBOLSOS', requiresThirdParty: false },
  ],
  // 238025: Fondo de solidaridad
  '238025': [
    { code: '23802501', name: 'FONDO DE SOLIDARIDAD - CUOTAS RECAUDADAS', requiresThirdParty: false },
    { code: '23802502', name: 'FONDO DE SOLIDARIDAD - AUXILIOS ENTREGADOS', requiresThirdParty: false },
  ],
  // 238035: Fondo de turismo
  '238035': [
    { code: '23803501', name: 'FONDO DE TURISMO - EXCURSIONES Y RECREACIÓN', requiresThirdParty: false },
  ],
  // 238095: Fondos actividades especiales
  '238095': [
    { code: '23809501', name: 'FONDOS ACTIVIDADES ESPECIALES Y BINGOS RECAUDADOS', requiresThirdParty: false },
  ],
  // 311505: Aportes sociales ordinarios
  '311505': [
    { code: '31150501', name: 'APORTES SOCIALES ORDINARIOS ASOCIADOS', requiresThirdParty: true },
    { code: '31150502', name: 'APORTES CUOTA MENSUAL ESTATUTARIA', requiresThirdParty: true },
  ],
  // 3115: Aportes sociales
  '3115': [
    { code: '311505', name: 'Aportes sociales ordinarios', requiresThirdParty: true },
    { code: '311510', name: 'Aportes extraordinarios', requiresThirdParty: true },
  ],
  // 417010: Cuotas de administración y sostenimiento
  '417010': [
    { code: '41701001', name: 'CUOTAS ORDINARIAS DE SOSTENIMIENTO', requiresThirdParty: false },
    { code: '41701002', name: 'CUOTAS EXTRAORDINARIAS DE ADMINISTRACIÓN', requiresThirdParty: false },
  ],
  // 421005: Intereses sobre préstamos a asociados
  '421005': [
    { code: '42100501', name: 'INTERESES CORRIENTES PRÉSTAMOS ASOCIADOS', requiresThirdParty: false },
    { code: '42100502', name: 'INTERESES DE MORA CARTERA ASOCIADOS', requiresThirdParty: false },
  ],
  // 429581: Eventos, bingos y actividades
  '429581': [
    { code: '42958101', name: 'INGRESOS POR BINGOS Y RIFAS', requiresThirdParty: false },
    { code: '42958102', name: 'INGRESOS POR EVENTOS Y BAZARES', requiresThirdParty: false },
  ],
  // 5105: Gastos de personal administración
  '5105': [
    { code: '510506', name: 'Sueldos', requiresThirdParty: false },
    { code: '510515', name: 'Horas extras y recargos', requiresThirdParty: false },
    { code: '510527', name: 'Auxilio de transporte', requiresThirdParty: false },
    { code: '510530', name: 'Cesantías', requiresThirdParty: false },
    { code: '510533', name: 'Intereses sobre cesantías', requiresThirdParty: false },
    { code: '510536', name: 'Prima de servicios', requiresThirdParty: false },
    { code: '510539', name: 'Vacaciones', requiresThirdParty: false },
    { code: '510568', name: 'Aportes a salud (EPS)', requiresThirdParty: false },
    { code: '510569', name: 'Aportes a pensión (AFP)', requiresThirdParty: false },
    { code: '510570', name: 'Aportes a riesgos laborales (ARL)', requiresThirdParty: false },
    { code: '510572', name: 'Aportes a caja de compensación familiar', requiresThirdParty: false },
  ],
  // 5135: Servicios administrativos
  '5135': [
    { code: '513505', name: 'Aseo y vigilancia', requiresThirdParty: false },
    { code: '513525', name: 'Acueducto y alcantarillado', requiresThirdParty: false },
    { code: '513530', name: 'Energía eléctrica', requiresThirdParty: false },
    { code: '513535', name: 'Teléfono e internet', requiresThirdParty: false },
    { code: '513550', name: 'Transporte, fletes y acarreos', requiresThirdParty: false },
    { code: '513595', name: 'Otros servicios generales', requiresThirdParty: false },
  ],
};

export interface PucSubaccountOption {
  code: string;
  name: string;
  level: number;
  nature: 'DEBIT' | 'CREDIT';
  requiresThirdParty: boolean;
  isStandardCatalog: boolean;
  isAlreadyActive?: boolean;
}

export function getPucSubaccountOptions(
  parent: PucAccount,
  activeAccounts: PucAccount[]
): PucSubaccountOption[] {
  const result: PucSubaccountOption[] = [];
  const seenCodes = new Set<string>();
  const activeCodes = new Set(activeAccounts.filter((a) => a.isActive).map((a) => a.code));

  const addOption = (
    code: string,
    name: string,
    level: number,
    nature: 'DEBIT' | 'CREDIT',
    requiresThirdParty: boolean,
    isStandardCatalog: boolean
  ) => {
    if (seenCodes.has(code) || code === parent.code) return;
    seenCodes.add(code);
    result.push({
      code,
      name,
      level,
      nature,
      requiresThirdParty,
      isStandardCatalog,
      isAlreadyActive: activeCodes.has(code),
    });
  };

  // 1. Check OFFICIAL_PUC_SUBACCOUNTS_MAP
  const predefined = OFFICIAL_PUC_SUBACCOUNTS_MAP[parent.code];
  if (predefined && predefined.length > 0) {
    predefined.forEach((item) => {
      const level = item.code.length <= 4 ? 3 : item.code.length <= 6 ? 4 : 5;
      addOption(
        item.code,
        item.name,
        level,
        item.nature || parent.nature,
        item.requiresThirdParty ?? parent.requiresThirdParty ?? false,
        true
      );
    });
  }

  // 2. Check STANDARD_PUC_CATALOG
  STANDARD_PUC_CATALOG.forEach((item) => {
    if (item.parentCode === parent.code || (item.code.startsWith(parent.code) && item.code !== parent.code)) {
      addOption(
        item.code,
        item.name,
        item.level,
        item.nature,
        item.requiresThirdParty ?? false,
        true
      );
    }
  });

  // 3. Always provide standard sequential suggestions if few options
  const defaultSubSuffixes = [
    { suffix: '01', desc: 'Principal' },
    { suffix: '02', desc: 'Auxiliar / Operativo' },
    { suffix: '03', desc: 'Recaudos / Cobranzas' },
    { suffix: '04', desc: 'Sucursal / Sede' },
  ];

  defaultSubSuffixes.forEach((item) => {
    const candidateCode = `${parent.code}${item.suffix}`;
    const level = candidateCode.length <= 4 ? 3 : candidateCode.length <= 6 ? 4 : 5;
    addOption(
      candidateCode,
      `${parent.name.toUpperCase()} - ${item.desc.toUpperCase()}`,
      level,
      parent.nature,
      parent.requiresThirdParty || false,
      false
    );
  });

  return result;
}

