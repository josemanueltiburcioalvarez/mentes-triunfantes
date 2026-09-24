// Guias paso a paso del nivel Experto: numeros con signo y ecuaciones.
import type { EscenaLineas, LineaEscena, PasoGuia } from "./tipos";

const lineas = (...ls: LineaEscena[]): EscenaLineas => ({ tipo: "lineas", lineas: ls });
const L = (t: string, e?: LineaEscena["e"]): LineaEscena => ({ t, e });

// ---------------------------------------------------------------- suma con signos
export function guiaSumaSignosIguales(): PasoGuia[] {
  return [
    {
      titulo: "Qué significan los signos",
      texto:
        "Los números enteros pueden ser **positivos** (+) o **negativos** (−). Piensa en dinero: un positivo es lo que **tienes** y un negativo es lo que **debes**. " +
        "Sumar dos números con el mismo signo es juntar cosas de la misma clase.",
      escena: lineas(
        L("(+5)  →  tengo 5", "foco"),
        L("(−5)  →  debo 5", "foco"),
        L(""),
        L("Signos iguales: junto tenencias con tenencias o deudas con deudas.")
      ),
    },
    {
      titulo: "Signos iguales: se suman y se deja el mismo signo",
      texto:
        "En (−7) + (−5) debo 7 y debo 5 más: en total debo 12. Sumo los números **sin signo** (7 + 5 = 12) y le dejo el signo que tenían: negativo.",
      escena: lineas(
        L("(−7) + (−5)", "foco"),
        L("7 + 5 = 12   ← se suman sin signo"),
        L("signo: los dos son (−)  →  (−)"),
        L("(−7) + (−5) = (−12)", "resultado")
      ),
    },
    {
      titulo: "Lo mismo con positivos",
      texto: "(+8) + (+6): tengo 8 y me dan 6: tengo 14. Signos iguales (los dos +), se suma y queda +.",
      escena: lineas(L("(+8) + (+6)", "foco"), L("8 + 6 = 14"), L("(+8) + (+6) = (+14)", "resultado")),
    },
    {
      titulo: "Con números grandes, la suma en vertical",
      texto:
        "Si los números son grandes, la suma sin signo (**347 + 285**) se hace en columnas, como ya sabes. El signo se decide **antes**, mirando los signos: " +
        "(−347) + (−285) → signos iguales → resultado negativo → **−632**.",
      escena: lineas(L("(−347) + (−285)", "foco"), L("347 + 285 = 632   (en vertical)"), L("(−347) + (−285) = (−632)", "resultado")),
    },
  ];
}

export function guiaSumaSignosDiferentes(): PasoGuia[] {
  return [
    {
      titulo: "Signos diferentes: tenencias contra deudas",
      texto:
        "Si un número es positivo y el otro negativo, se **contrarrestan**. En (+9) + (−4) tengo 9 y debo 4: pago la deuda y me quedo con 5.",
      escena: lineas(L("(+9) + (−4)", "foco"), L("tengo 9, debo 4"), L("pago 4 → me quedan 5"), L("(+9) + (−4) = (+5)", "resultado")),
    },
    {
      titulo: "Se restan los números y gana el signo del mayor",
      texto:
        "Regla: restas el número menor del mayor (**sin signos**) y el resultado lleva el signo del número que tiene el valor más grande. " +
        "En (−9) + (+4): 9 − 4 = 5; el 9 es el mayor y es negativo → **(−5)**.",
      escena: lineas(
        L("(−9) + (+4)", "foco"),
        L("9 − 4 = 5   ← mayor menos menor"),
        L("el mayor es el 9 y es (−)  →  (−)"),
        L("(−9) + (+4) = (−5)", "resultado")
      ),
    },
    {
      titulo: "Cuando gana el positivo",
      texto: "En (−3) + (+8): 8 − 3 = 5. Ahora el mayor es el 8, que es positivo, así que el resultado es **(+5)**.",
      escena: lineas(L("(−3) + (+8)", "foco"), L("8 − 3 = 5"), L("el mayor es el 8 y es (+)  →  (+)"), L("(−3) + (+8) = (+5)", "resultado")),
    },
    {
      titulo: "Con números grandes: resta en vertical",
      texto:
        "Con (−52) + (+27) restas **52 − 27** en vertical (pidiendo prestado si hace falta): da 25. El mayor es el 52 (negativo), así que el resultado es **(−25)**.",
      escena: lineas(L("(−52) + (+27)", "foco"), L("52 − 27 = 25   (en vertical)"), L("(−52) + (+27) = (−25)", "resultado")),
    },
  ];
}

// ---------------------------------------------------------------- resta con signos
export function guiaRestaSignosOpuesto(): PasoGuia[] {
  return [
    {
      titulo: "Restar es sumar el opuesto",
      texto:
        "Con signos, una resta se convierte en suma: **cambias el − por + y cambias el signo del segundo número**. " +
        "Restar una deuda es lo mismo que ganar dinero.",
      escena: lineas(
        L("(+5) − (−2)", "foco"),
        L("cambio  −  por  +"),
        L("cambio (−2) por su opuesto (+2)"),
        L("(+5) + (+2) = (+7)", "resultado")
      ),
    },
    {
      titulo: "Otro ejemplo",
      texto: "(−4) − (+6): lo convierto en (−4) + (−6). Ahora son signos iguales: 4 + 6 = 10, con signo negativo.",
      escena: lineas(
        L("(−4) − (+6)", "foco"),
        L("(−4) + (−6)   ← cambié − por + y (+6) por (−6)"),
        L("signos iguales: 4 + 6 = 10"),
        L("(−4) − (+6) = (−10)", "resultado")
      ),
    },
    {
      titulo: "Y una resta normal",
      texto: "(+8) − (+3) se convierte en (+8) + (−3): signos diferentes, 8 − 3 = 5, gana el 8 (+). Resultado (+5).",
      escena: lineas(L("(+8) − (+3)", "foco"), L("(+8) + (−3)"), L("(+8) − (+3) = (+5)", "resultado")),
    },
  ];
}

export function guiaRestasSeguidas(): PasoGuia[] {
  return [
    {
      titulo: "Varios números: de izquierda a derecha",
      texto:
        "Cuando hay tres o más números, se resuelve de **dos en dos, de izquierda a derecha**. Cada paso se hace igual que antes: convertir en suma, mirar los signos y calcular.",
      escena: lineas(L("(−6) − (+4) − (−9)", "foco"), L("primero:  (−6) − (+4)"), L("después: el resultado − (−9)")),
    },
    {
      titulo: "Primer paso",
      texto: "(−6) − (+4) = (−6) + (−4): signos iguales, 6 + 4 = 10 → **(−10)**.",
      escena: lineas(L("(−6) − (+4) − (−9)", "apagado"), L("(−6) − (+4) = (−6) + (−4) = (−10)", "foco")),
    },
    {
      titulo: "Segundo paso",
      texto: "Ahora (−10) − (−9) = (−10) + (+9): signos diferentes, 10 − 9 = 1, gana el 10 (−) → **(−1)**.",
      escena: lineas(
        L("(−6) − (+4) − (−9)", "apagado"),
        L("= (−10) − (−9)", "apagado"),
        L("(−10) − (−9) = (−10) + (+9) = (−1)", "foco"),
        L("resultado: (−1)", "resultado")
      ),
    },
  ];
}

// ---------------------------------------------------------------- multiplicacion con signos
export function guiaReglaSignosMultiplicar(): PasoGuia[] {
  return [
    {
      titulo: "La regla de los signos",
      texto:
        "Para multiplicar números con signo se hacen **dos cosas por separado**: decidir el signo con la regla de los signos y multiplicar los números sin signo.",
      escena: lineas(
        L("(+) × (+) = (+)", "foco"),
        L("(−) × (−) = (+)", "foco"),
        L("(+) × (−) = (−)"),
        L("(−) × (+) = (−)"),
        L(""),
        L("iguales → +      diferentes → −")
      ),
    },
    {
      titulo: "Ejemplo",
      texto:
        "(−6) × (+7): los signos son diferentes → el resultado es **negativo**. Y 6 × 7 = 42. Junto las dos cosas: **(−42)**.",
      escena: lineas(L("(−6) × (+7)", "foco"), L("signos diferentes  →  (−)"), L("6 × 7 = 42"), L("(−6) × (+7) = (−42)", "resultado")),
    },
    {
      titulo: "Dos negativos dan positivo",
      texto: "(−5) × (−8): los signos son iguales → **positivo**. 5 × 8 = 40 → **(+40)**. Piensa: quitar una deuda 8 veces es ganar.",
      escena: lineas(L("(−5) × (−8)", "foco"), L("signos iguales  →  (+)"), L("5 × 8 = 40"), L("(−5) × (−8) = (+40)", "resultado")),
    },
  ];
}

export function guiaMultiplicarGrandesSignos(): PasoGuia[] {
  return [
    {
      titulo: "Primero el signo",
      texto: "(−23) × (−14): los dos son negativos → signos iguales → el resultado será **positivo**.",
      escena: lineas(L("(−23) × (−14)", "foco"), L("(−) × (−)  →  (+)")),
    },
    {
      titulo: "Después la multiplicación sin signos",
      texto:
        "Ahora multiplico **23 × 14** en vertical: 23 × 4 = 92 (primer producto parcial) y 23 × 10 = 230 (segundo, corrido un lugar). 92 + 230 = **322**.",
      escena: lineas(L("23 × 14", "foco"), L("23 × 4  =  92"), L("23 × 10 = 230"), L("92 + 230 = 322")),
    },
    {
      titulo: "Junto el signo y el número",
      texto: "El signo era positivo y el número 322: (−23) × (−14) = **(+322)**.",
      escena: lineas(L("(−23) × (−14) = (+322)", "resultado")),
    },
  ];
}

// ---------------------------------------------------------------- division con signos
export function guiaReglaSignosDividir(): PasoGuia[] {
  return [
    {
      titulo: "La misma regla de los signos",
      texto: "Al dividir se usa **exactamente la misma regla** que al multiplicar: signos iguales → positivo; signos diferentes → negativo.",
      escena: lineas(
        L("(+) ÷ (+) = (+)", "foco"),
        L("(−) ÷ (−) = (+)", "foco"),
        L("(+) ÷ (−) = (−)"),
        L("(−) ÷ (+) = (−)")
      ),
    },
    {
      titulo: "Ejemplo",
      texto: "(+72) ÷ (−8): signos diferentes → **negativo**. 72 ÷ 8 = 9. Resultado: **(−9)**.",
      escena: lineas(L("(+72) ÷ (−8)", "foco"), L("signos diferentes  →  (−)"), L("72 ÷ 8 = 9"), L("(+72) ÷ (−8) = (−9)", "resultado")),
    },
    {
      titulo: "Compruébalo multiplicando",
      texto: "Una división se comprueba multiplicando el resultado por el divisor: (−9) × (−8) = (+72). ¡Coincide con el dividendo!",
      escena: lineas(L("(−9) × (−8) = (+72)", "resultado"), L("es el número que dividimos ✓")),
    },
  ];
}

export function guiaDividirGrandesSignos(): PasoGuia[] {
  return [
    {
      titulo: "Primero el signo",
      texto: "(−756) ÷ (−21): los dos son negativos → signos iguales → el cociente será **positivo**.",
      escena: lineas(L("(−756) ÷ (−21)", "foco"), L("(−) ÷ (−)  →  (+)")),
    },
    {
      titulo: "Después la división sin signos",
      texto:
        "Divido **756 ÷ 21** con el método de siempre (dividir, multiplicar, restar y bajar): 75 ÷ 21 cabe 3 veces (63), sobran 12; bajo el 6 → 126 ÷ 21 = 6 veces (126), sobra 0. El cociente es **36**.",
      escena: lineas(L("756 ÷ 21", "foco"), L("75 ÷ 21 → 3   (3 × 21 = 63)"), L("75 − 63 = 12, bajo el 6 → 126"), L("126 ÷ 21 → 6   (6 × 21 = 126)"), L("cociente: 36")),
    },
    {
      titulo: "Junto el signo",
      texto: "Signo positivo y cociente 36: (−756) ÷ (−21) = **(+36)**.",
      escena: lineas(L("(−756) ÷ (−21) = (+36)", "resultado")),
    },
  ];
}

// ---------------------------------------------------------------- potencia con signos
export function guiaPotenciaParImpar(): PasoGuia[] {
  return [
    {
      titulo: "Potencia de un número negativo",
      texto:
        "Una potencia es multiplicar la base por sí misma. Con una base negativa hay que cuidar el signo: **(−3)²** significa (−3) × (−3).",
      escena: lineas(L("(−3)² = (−3) × (−3)", "foco"), L("(−) × (−) = (+)"), L("3 × 3 = 9"), L("(−3)² = (+9)", "resultado")),
    },
    {
      titulo: "Exponente impar: queda negativo",
      texto:
        "(−3)³ = (−3) × (−3) × (−3). Los dos primeros dan (+9), y (+9) × (−3) = (−27). El signo queda **negativo**.",
      escena: lineas(L("(−3)³ = (−3) × (−3) × (−3)", "foco"), L("(−3) × (−3) = (+9)"), L("(+9) × (−3) = (−27)"), L("(−3)³ = (−27)", "resultado")),
    },
    {
      titulo: "La regla corta",
      texto:
        "Con base **negativa**: exponente **par** → resultado **positivo**; exponente **impar** → resultado **negativo**. Después calculas la potencia de los números sin signo, con multiplicaciones en vertical.",
      escena: lineas(
        L("(−2)² = +4      (par)"),
        L("(−2)³ = −8      (impar)"),
        L("(−2)⁴ = +16     (par)"),
        L("(−2)⁵ = −32     (impar)", "foco")
      ),
    },
  ];
}

export function guiaPotenciaParentesis(): PasoGuia[] {
  return [
    {
      titulo: "El paréntesis lo cambia todo",
      texto:
        "**(−3)²** y **−3²** parecen iguales, pero no lo son. Con paréntesis, el exponente afecta también al signo. Sin paréntesis, el exponente solo afecta al 3.",
      escena: lineas(L("(−3)²  ≠  −3²", "foco"), L(""), L("(−3)² = (−3) × (−3) = +9"), L("−3²  =  −(3 × 3) = −9")),
    },
    {
      titulo: "Sin paréntesis: primero la potencia",
      texto:
        "En **−3²** primero se calcula la potencia (3² = 9) y **después** se le pone el menos: −9. Siempre da negativo, sin importar si el exponente es par o impar.",
      escena: lineas(L("−3²", "foco"), L("3² = 9   ← primero la potencia"), L("−9   ← luego el signo menos", "resultado")),
    },
    {
      titulo: "Con paréntesis: el signo también se eleva",
      texto:
        "En **(−3)²** el paréntesis dice que la base es −3 completo, así que se multiplica (−3) × (−3) = +9. Mira la base: ¿el menos está dentro o fuera del paréntesis?",
      escena: lineas(L("(−3)² = +9", "resultado"), L("−3²  = −9", "resultado"), L(""), L("¿menos dentro del paréntesis? → se eleva"), L("¿menos afuera? → se pone al final")),
    },
  ];
}

// ---------------------------------------------------------------- raiz con signos
export function guiaRaizExiste(): PasoGuia[] {
  return [
    {
      titulo: "¿Existe la raíz?",
      texto:
        "√49 pregunta: ¿qué número multiplicado por sí mismo da 49? Es el 7, porque 7 × 7 = 49 (y también (−7) × (−7), pero la raíz cuadrada da solo el resultado **positivo**).",
      escena: lineas(L("√49 = 7", "resultado"), L("7 × 7 = 49")),
    },
    {
      titulo: "La raíz cuadrada de un negativo no existe",
      texto:
        "¿Qué número multiplicado por sí mismo da −49? (+7) × (+7) = +49 y (−7) × (−7) = +49. **Ninguno da −49**, así que √(−49) **no existe** en los números enteros.",
      escena: lineas(L("√(−49)", "foco"), L("(+7) × (+7) = +49"), L("(−7) × (−7) = +49"), L("no existe en los enteros", "resultado")),
    },
    {
      titulo: "La raíz cúbica sí acepta negativos",
      texto:
        "En la raíz **cúbica** (∛) se multiplica tres veces, y (−3) × (−3) × (−3) = −27. Por eso ∛(−27) = **−3**: el resultado tiene el mismo signo que el número de adentro.",
      escena: lineas(L("∛(−27)", "foco"), L("(−3) × (−3) × (−3) = −27"), L("∛(−27) = (−3)", "resultado")),
    },
    {
      titulo: "Compruebas multiplicando",
      texto:
        "Como siempre, la raíz se comprueba multiplicando. Con los números sin signo: 3 × 3 × 3 = 27. Eso es lo que escribirás en vertical.",
      escena: lineas(L("∛27 = 3", "resultado"), L("porque 3 × 3 × 3 = 27")),
    },
  ];
}

export function guiaRaizMenosAfuera(): PasoGuia[] {
  return [
    {
      titulo: "El menos de afuera",
      texto:
        "En **−√49** el signo menos está **afuera** de la raíz. Primero se calcula la raíz (√49 = 7) y **después** se cambia el signo: **−7**.",
      escena: lineas(L("−√49", "foco"), L("√49 = 7   ← primero la raíz"), L("−7   ← luego el menos de afuera", "resultado")),
    },
    {
      titulo: "Con raíz cúbica de un negativo",
      texto:
        "−∛(−27): primero la raíz: ∛(−27) = −3. Después el menos de afuera cambia el signo: −(−3) = **+3**. Dos menos seguidos se convierten en más.",
      escena: lineas(L("−∛(−27)", "foco"), L("∛(−27) = (−3)"), L("−(−3) = (+3)", "resultado")),
    },
    {
      titulo: "Y si la raíz no existe",
      texto:
        "En −√(−49) primero miras el radicando: es la raíz cuadrada de un negativo, así que **no existe**, aunque haya un menos afuera. Antes de calcular, pregúntate siempre si la raíz existe.",
      escena: lineas(L("−√(−49)", "foco"), L("√(−49) no existe", "resultado")),
    },
  ];
}

// ---------------------------------------------------------------- ecuaciones
export function guiaEcuacionIntro(): PasoGuia[] {
  return [
    {
      titulo: "Qué es una ecuación",
      texto:
        "Una ecuación es una igualdad con un número escondido, la **x**. Resolverla es descubrir cuánto vale. Piensa en una balanza en equilibrio: lo que hagas de un lado, lo haces del otro.",
      escena: lineas(L("x + 7 = 15", "foco"), L(""), L("¿qué número, sumado a 7, da 15?")),
    },
    {
      titulo: "Deshaz la operación con la operación contraria",
      texto:
        "A la x le están **sumando 7**. Para dejarla sola hago lo contrario: **resto 7** a los dos lados. Lo contrario de sumar es restar; de multiplicar, dividir.",
      escena: lineas(L("x + 7 = 15", "apagado"), L("x + 7 − 7 = 15 − 7", "foco"), L("x = 8", "resultado")),
    },
    {
      titulo: "Comprueba sustituyendo",
      texto: "Cambio la x por 8: 8 + 7 = 15. Es lo que decía la ecuación, así que **x = 8** está bien.",
      escena: lineas(L("x = 8", "resultado"), L("8 + 7 = 15 ✓")),
    },
    {
      titulo: "Con multiplicar y dividir",
      texto: "En **4x = 20**, la x está multiplicada por 4. Lo contrario es **dividir entre 4** a los dos lados: x = 20 ÷ 4 = **5**.",
      escena: lineas(L("4x = 20", "foco"), L("4x ÷ 4 = 20 ÷ 4"), L("x = 5", "resultado")),
    },
  ];
}

export function guiaEcuacionDosPasos(): PasoGuia[] {
  return [
    {
      titulo: "Dos operaciones alrededor de la x",
      texto:
        "En **3x + 5 = 20** la x está multiplicada por 3 **y** le suman 5. Se deshacen **en orden contrario al de las operaciones**: primero lo que suma o resta, después lo que multiplica o divide.",
      escena: lineas(L("3x + 5 = 20", "foco"), L("1.º  quito el + 5"), L("2.º  quito el × 3")),
    },
    {
      titulo: "Primero: quito el + 5",
      texto: "Resto 5 a los dos lados: 20 − 5 = 15. La ecuación queda **3x = 15**.",
      escena: lineas(L("3x + 5 = 20", "apagado"), L("3x + 5 − 5 = 20 − 5", "foco"), L("3x = 15")),
    },
    {
      titulo: "Después: quito el × 3",
      texto: "Divido entre 3 los dos lados: 15 ÷ 3 = 5. Entonces **x = 5**.",
      escena: lineas(L("3x = 15", "apagado"), L("3x ÷ 3 = 15 ÷ 3", "foco"), L("x = 5", "resultado")),
    },
    {
      titulo: "Comprueba",
      texto: "Sustituyo: 3 × 5 + 5 = 15 + 5 = 20 ✓. En el ejercicio harás esta comprobación al final.",
      escena: lineas(L("3 × 5 + 5 = 20 ✓", "resultado")),
    },
  ];
}

export function guiaEcuacionAmbosLados(): PasoGuia[] {
  return [
    {
      titulo: "La x en los dos lados",
      texto:
        "En **5x + 4 = 2x + 19** hay x a ambos lados. Primero **junto las x** de un mismo lado: resto la x más pequeña (2x) a los dos lados.",
      escena: lineas(L("5x + 4 = 2x + 19", "foco"), L("5x − 2x + 4 = 2x − 2x + 19"), L("3x + 4 = 19")),
    },
    {
      titulo: "Ahora es una ecuación de dos pasos",
      texto: "Resto 4: 19 − 4 = 15 → 3x = 15. Divido entre 3: **x = 5**.",
      escena: lineas(L("3x + 4 = 19", "apagado"), L("3x = 19 − 4 = 15"), L("x = 15 ÷ 3 = 5", "resultado")),
    },
    {
      titulo: "La x puede salir negativa",
      texto:
        "A veces la solución es un número negativo, por ejemplo 4x + 3 = x − 9: 3x + 3 = −9 → 3x = −12 → **x = −4**. Aquí se usan las reglas de los signos que ya practicaste.",
      escena: lineas(L("4x + 3 = x − 9", "foco"), L("3x + 3 = −9"), L("3x = −9 − 3 = −12"), L("x = −12 ÷ 3 = −4", "resultado")),
    },
    {
      titulo: "Comprueba en los dos lados",
      texto: "Sustituyo x = −4 en cada lado: 4 × (−4) + 3 = −13 y (−4) − 9 = −13. **Los dos lados dan lo mismo**, así que está bien.",
      escena: lineas(L("4 × (−4) + 3 = −13", "resultado"), L("(−4) − 9 = −13", "resultado")),
    },
  ];
}
