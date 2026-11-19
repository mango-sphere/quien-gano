import { PantallaResultados } from "@/components/PantallaResultados";
import { regionesMapa, textoEstadoDatos, vistaNacional } from "@/lib/vista";

export default function Page() {
  return (
    <PantallaResultados vista={vistaNacional()} regionesMapa={regionesMapa()} estadoDatos={textoEstadoDatos()} />
  );
}
