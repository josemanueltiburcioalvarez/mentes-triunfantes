// Lista fija de grados (no texto libre) para que el admin pueda filtrar/reportar con confianza.
// El valor sigue el patron "primaria_N" / "secundaria_N" del que se deduce la modalidad (ver la
// funcion actualizar_modalidad_perfil en la base de datos).
export const GRADOS_ESCOLARES: { value: string; label: string }[] = [
  { value: "primaria_1", label: "1.° de primaria" },
  { value: "primaria_2", label: "2.° de primaria" },
  { value: "primaria_3", label: "3.° de primaria" },
  { value: "primaria_4", label: "4.° de primaria" },
  { value: "primaria_5", label: "5.° de primaria" },
  { value: "primaria_6", label: "6.° de primaria" },
  { value: "secundaria_1", label: "1.° de secundaria" },
  { value: "secundaria_2", label: "2.° de secundaria" },
  { value: "secundaria_3", label: "3.° de secundaria" },
  { value: "secundaria_4", label: "4.° de secundaria" },
  { value: "secundaria_5", label: "5.° de secundaria" },
];

const VALORES_VALIDOS = new Set(GRADOS_ESCOLARES.map((g) => g.value));

export function esGradoEscolarValido(valor: string): boolean {
  return VALORES_VALIDOS.has(valor);
}

export function nombreGrado(valor: string | null | undefined): string {
  return GRADOS_ESCOLARES.find((g) => g.value === valor)?.label ?? "-";
}
