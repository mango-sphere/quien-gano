import { PantallaResultados } from "@/components/PantallaResultados";
import { estadoDatos, vistaNacional } from "@/lib/vista";

export default function Page() {
  return (
    <PantallaResultados vista={vistaNacional()} estadoDatos={estadoDatos()} conPortada />
  );
}
