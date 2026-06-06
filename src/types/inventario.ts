// ==========================================
// INTERFACES DE RELACIONES (TABLAS SECUNDARIAS)
// ==========================================

export interface Usuario {
  id_usuario?: number;
  cod_planilla?: string | null;
  nombres: string;
  apellidos: string;
  email_institucional?: string | null;
  anexo?: string | null;
  usuario_red_windows?: string | null;
  activo?: boolean;
}

export interface Ubicacion {
  id_ubicacion?: number;
  servicio: string;
  area: string;
}

// ==========================================
// INTERFACES PRINCIPALES
// ==========================================

export interface Equipo {
  id_equipo: number;
  tipo_equipo: string | null;
  marca: string | null;
  modelo: string | null;
  numero_serie: string | null;
  cod_patrimonio: string | null;
  cod_patrimonio_verde: string | null;
  estado: string | null;
  created_at?: string;
  
  // Datos de Red y Hardware
  nombre_red_pc: string | null;
  direccion_ip?: string | null;
  direccion_mac?: string | null;
  procesador?: string | null;
  memoria_ram?: string | null;
  almacenamiento?: string | null;
  
  // Software
  sistema_operativo?: string | null;
  antivirus?: string | null;
  clave_vnc?: string | null;

  // Permisos (Booleanos)
  tiene_sap?: boolean;
  tiene_ses?: boolean;
  tiene_winepi?: boolean;
  tiene_sinadef?: boolean;
  en_dominio?: boolean;
  tiene_internet?: boolean;

  // Relaciones (JOINs de Supabase)
  usuarios?: Usuario | null;
  ubicaciones?: Ubicacion | null;
}

export interface Periferico {
  id_periferico: number;
  tipo_periferico: string | null;
  marca: string | null;
  modelo: string | null;
  n_serie: string | null; 
  numero_serie?: string | null;
  cod_patrimonio_azul: string | null;
  cod_patrimonio_verde: string | null;
  cod_patrimonio?: string | null;
  created_at?: string;
  
  // Estado y Detalles
  estado_fisico: string | null;
  estado?: string | null;
  detalle_tecnico: string | null;
  observaciones_almacen: string | null;
  
  // Relaciones
  id_equipo?: number | null;
  equipos?: { nombre_red_pc: string } | null;
}

// ==========================================
// INTERFACES DE HISTORIAL (BITÁCORAS)
// ==========================================

export interface EstadoHistorial {
  id_estado?: number;
  id_equipo?: number;
  id_periferico?: number;
  tipo_estado: string;
  motivo: string | null;
  fecha?: string;
  created_at?: string;
}