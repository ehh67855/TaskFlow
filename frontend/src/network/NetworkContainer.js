import { Container } from "react-bootstrap";
import NetworkCreator from "./NetworkCreator";
import Sidebar from "./SideBar";
import VisNetwork from "./VisNetwork";

export default function NetworkContainer() {
    return(
            <Container className="main-content">
                <VisNetwork />

            </Container>

    );
}