export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ejercicios: {
        Row: {
          created_at: string
          dificultad: number
          enunciado: string
          explicacion: string | null
          habilidad_id: string
          id: string
          respuesta: string
        }
        Insert: {
          created_at?: string
          dificultad: number
          enunciado: string
          explicacion?: string | null
          habilidad_id: string
          id?: string
          respuesta: string
        }
        Update: {
          created_at?: string
          dificultad?: number
          enunciado?: string
          explicacion?: string | null
          habilidad_id?: string
          id?: string
          respuesta?: string
        }
        Relationships: [
          {
            foreignKeyName: "ejercicios_habilidad_id_fkey"
            columns: ["habilidad_id"]
            isOneToOne: false
            referencedRelation: "habilidades"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluaciones_habilidad: {
        Row: {
          aprobado: boolean
          created_at: string
          estudiante_id: string
          habilidad_id: string
          id: string
          puntaje: number
          sesion_id: string | null
        }
        Insert: {
          aprobado: boolean
          created_at?: string
          estudiante_id: string
          habilidad_id: string
          id?: string
          puntaje: number
          sesion_id?: string | null
        }
        Update: {
          aprobado?: boolean
          created_at?: string
          estudiante_id?: string
          habilidad_id?: string
          id?: string
          puntaje?: number
          sesion_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluaciones_habilidad_estudiante_id_fkey"
            columns: ["estudiante_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluaciones_habilidad_habilidad_id_fkey"
            columns: ["habilidad_id"]
            isOneToOne: false
            referencedRelation: "habilidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluaciones_habilidad_sesion_id_fkey"
            columns: ["sesion_id"]
            isOneToOne: false
            referencedRelation: "sesiones"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluaciones_nivel: {
        Row: {
          aprobado: boolean
          created_at: string
          estudiante_id: string
          id: string
          nivel_id: string
          puntaje: number
          sesion_id: string | null
        }
        Insert: {
          aprobado: boolean
          created_at?: string
          estudiante_id: string
          id?: string
          nivel_id: string
          puntaje: number
          sesion_id?: string | null
        }
        Update: {
          aprobado?: boolean
          created_at?: string
          estudiante_id?: string
          id?: string
          nivel_id?: string
          puntaje?: number
          sesion_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluaciones_nivel_estudiante_id_fkey"
            columns: ["estudiante_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluaciones_nivel_nivel_id_fkey"
            columns: ["nivel_id"]
            isOneToOne: false
            referencedRelation: "niveles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluaciones_nivel_sesion_id_fkey"
            columns: ["sesion_id"]
            isOneToOne: false
            referencedRelation: "sesiones"
            referencedColumns: ["id"]
          },
        ]
      }
      habilidades: {
        Row: {
          id: string
          nivel_id: string
          nombre: Database["public"]["Enums"]["nombre_habilidad"]
          nota_aprobacion: number
          orden: number
        }
        Insert: {
          id?: string
          nivel_id: string
          nombre: Database["public"]["Enums"]["nombre_habilidad"]
          nota_aprobacion?: number
          orden: number
        }
        Update: {
          id?: string
          nivel_id?: string
          nombre?: Database["public"]["Enums"]["nombre_habilidad"]
          nota_aprobacion?: number
          orden?: number
        }
        Relationships: [
          {
            foreignKeyName: "habilidades_nivel_id_fkey"
            columns: ["nivel_id"]
            isOneToOne: false
            referencedRelation: "niveles"
            referencedColumns: ["id"]
          },
        ]
      }
      intentos: {
        Row: {
          created_at: string
          dificultad: number
          enunciado: string
          es_correcto: boolean
          estudiante_id: string
          habilidad_id: string
          id: string
          respuesta_correcta: string
          respuesta_dada: string | null
          segundos: number
          sesion_id: string
        }
        Insert: {
          created_at?: string
          dificultad: number
          enunciado: string
          es_correcto: boolean
          estudiante_id: string
          habilidad_id: string
          id?: string
          respuesta_correcta: string
          respuesta_dada?: string | null
          segundos: number
          sesion_id: string
        }
        Update: {
          created_at?: string
          dificultad?: number
          enunciado?: string
          es_correcto?: boolean
          estudiante_id?: string
          habilidad_id?: string
          id?: string
          respuesta_correcta?: string
          respuesta_dada?: string | null
          segundos?: number
          sesion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intentos_estudiante_id_fkey"
            columns: ["estudiante_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intentos_habilidad_id_fkey"
            columns: ["habilidad_id"]
            isOneToOne: false
            referencedRelation: "habilidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intentos_sesion_id_fkey"
            columns: ["sesion_id"]
            isOneToOne: false
            referencedRelation: "sesiones"
            referencedColumns: ["id"]
          },
        ]
      }
      niveles: {
        Row: {
          id: string
          nombre: string
          nota_aprobacion: number
          orden: number
        }
        Insert: {
          id?: string
          nombre: string
          nota_aprobacion?: number
          orden: number
        }
        Update: {
          id?: string
          nombre?: string
          nota_aprobacion?: number
          orden?: number
        }
        Relationships: []
      }
      perfiles: {
        Row: {
          created_at: string
          estado: Database["public"]["Enums"]["estado_usuario"]
          fecha_ultimo_acceso: string | null
          grado_escolar: string | null
          id: string
          nombre: string
          rol: Database["public"]["Enums"]["rol_usuario"]
        }
        Insert: {
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_usuario"]
          fecha_ultimo_acceso?: string | null
          grado_escolar?: string | null
          id: string
          nombre: string
          rol?: Database["public"]["Enums"]["rol_usuario"]
        }
        Update: {
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_usuario"]
          fecha_ultimo_acceso?: string | null
          grado_escolar?: string | null
          id?: string
          nombre?: string
          rol?: Database["public"]["Enums"]["rol_usuario"]
        }
        Relationships: []
      }
      profesor_estudiante: {
        Row: {
          activo: boolean
          estudiante_id: string
          fecha_asignacion: string
          id: string
          profesor_id: string
        }
        Insert: {
          activo?: boolean
          estudiante_id: string
          fecha_asignacion?: string
          id?: string
          profesor_id: string
        }
        Update: {
          activo?: boolean
          estudiante_id?: string
          fecha_asignacion?: string
          id?: string
          profesor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profesor_estudiante_estudiante_id_fkey"
            columns: ["estudiante_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profesor_estudiante_profesor_id_fkey"
            columns: ["profesor_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      progreso_ejercicio: {
        Row: {
          aprobado: boolean
          desbloqueado: boolean
          digito: number
          estudiante_id: string
          habilidad_id: string
          intentos: number
          mejor_puntaje: number
          numero_ejercicio: number
          ultima_practica: string | null
        }
        Insert: {
          aprobado?: boolean
          desbloqueado?: boolean
          digito: number
          estudiante_id: string
          habilidad_id: string
          intentos?: number
          mejor_puntaje?: number
          numero_ejercicio: number
          ultima_practica?: string | null
        }
        Update: {
          aprobado?: boolean
          desbloqueado?: boolean
          digito?: number
          estudiante_id?: string
          habilidad_id?: string
          intentos?: number
          mejor_puntaje?: number
          numero_ejercicio?: number
          ultima_practica?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "progreso_ejercicio_estudiante_id_fkey"
            columns: ["estudiante_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progreso_ejercicio_habilidad_id_fkey"
            columns: ["habilidad_id"]
            isOneToOne: false
            referencedRelation: "habilidades"
            referencedColumns: ["id"]
          },
        ]
      }
      progreso_habilidad: {
        Row: {
          desbloqueada: boolean
          estudiante_id: string
          habilidad_id: string
          porcentaje_dominio: number
          total_intentos: number
          ultima_practica: string | null
        }
        Insert: {
          desbloqueada?: boolean
          estudiante_id: string
          habilidad_id: string
          porcentaje_dominio?: number
          total_intentos?: number
          ultima_practica?: string | null
        }
        Update: {
          desbloqueada?: boolean
          estudiante_id?: string
          habilidad_id?: string
          porcentaje_dominio?: number
          total_intentos?: number
          ultima_practica?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "progreso_habilidad_estudiante_id_fkey"
            columns: ["estudiante_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progreso_habilidad_habilidad_id_fkey"
            columns: ["habilidad_id"]
            isOneToOne: false
            referencedRelation: "habilidades"
            referencedColumns: ["id"]
          },
        ]
      }
      sesiones: {
        Row: {
          correctos: number
          digito: number | null
          estudiante_id: string
          fin: string | null
          habilidad_id: string
          id: string
          inicio: string
          numero_ejercicio: number | null
          tipo: Database["public"]["Enums"]["tipo_sesion"]
          total_ejercicios: number
        }
        Insert: {
          correctos?: number
          digito?: number | null
          estudiante_id: string
          fin?: string | null
          habilidad_id: string
          id?: string
          inicio?: string
          numero_ejercicio?: number | null
          tipo?: Database["public"]["Enums"]["tipo_sesion"]
          total_ejercicios?: number
        }
        Update: {
          correctos?: number
          digito?: number | null
          estudiante_id?: string
          fin?: string | null
          habilidad_id?: string
          id?: string
          inicio?: string
          numero_ejercicio?: number | null
          tipo?: Database["public"]["Enums"]["tipo_sesion"]
          total_ejercicios?: number
        }
        Relationships: [
          {
            foreignKeyName: "sesiones_estudiante_id_fkey"
            columns: ["estudiante_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sesiones_habilidad_id_fkey"
            columns: ["habilidad_id"]
            isOneToOne: false
            referencedRelation: "habilidades"
            referencedColumns: ["id"]
          },
        ]
      }
      suscripciones: {
        Row: {
          created_at: string
          estado: Database["public"]["Enums"]["estado_suscripcion"]
          estudiante_id: string
          fecha_fin: string
          fecha_inicio: string
          id: string
          metodo_pago: string | null
          monto: number
          referencia_pago: string | null
        }
        Insert: {
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_suscripcion"]
          estudiante_id: string
          fecha_fin: string
          fecha_inicio: string
          id?: string
          metodo_pago?: string | null
          monto?: number
          referencia_pago?: string | null
        }
        Update: {
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_suscripcion"]
          estudiante_id?: string
          fecha_fin?: string
          fecha_inicio?: string
          id?: string
          metodo_pago?: string | null
          monto?: number
          referencia_pago?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      vista_ingresos: {
        Row: {
          activas: number | null
          ingreso_mensual_total: number | null
          por_vencer_7_dias: number | null
          vencidas: number | null
        }
        Relationships: []
      }
      vista_resumen_estudiante: {
        Row: {
          desbloqueada: boolean | null
          dias_activos: number | null
          estudiante_id: string | null
          estudiante_nombre: string | null
          grado_escolar: string | null
          habilidad_nombre: Database["public"]["Enums"]["nombre_habilidad"] | null
          nivel_actual: string | null
          nivel_nombre: string | null
          nivel_orden: number | null
          porcentaje_dominio: number | null
          total_intentos: number | null
          ultima_practica: string | null
        }
        Relationships: []
      }
      vista_resumen_profesor: {
        Row: {
          estudiantes_activos: number | null
          profesor_id: string | null
          profesor_nombre: string | null
          progreso_promedio: number | null
          ultima_actividad_estudiantes: string | null
        }
        Relationships: []
      }
      vista_retencion: {
        Row: {
          dias_sin_practicar: number | null
          estudiante_id: string | null
          grado_escolar: string | null
          inactivo_15_dias: boolean | null
          inactivo_30_dias: boolean | null
          inactivo_7_dias: boolean | null
          nombre: string | null
          ultima_practica: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      es_profesor_de: { Args: { p_estudiante_id: string }; Returns: boolean }
      rol_actual: {
        Args: never
        Returns: Database["public"]["Enums"]["rol_usuario"]
      }
    }
    Enums: {
      estado_suscripcion: "pendiente" | "activa" | "vencida" | "cancelada"
      estado_usuario: "activo" | "inactivo" | "suspendido"
      nombre_habilidad:
        | "suma"
        | "resta"
        | "tabla_multiplicacion"
        | "multiplicacion"
        | "division"
        | "potencia"
        | "raiz"
        | "operaciones_combinadas"
        | "atajos"
        | "razonamiento"
      rol_usuario: "estudiante" | "profesor" | "admin"
      tipo_sesion: "practica" | "evaluacion" | "evaluacion_habilidad"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database["public"]

export type Tables<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Update"]
export type Views<T extends keyof DefaultSchema["Views"]> =
  DefaultSchema["Views"][T]["Row"]
export type Enums<T extends keyof DefaultSchema["Enums"]> =
  DefaultSchema["Enums"][T]
