import React from 'react';
import Header from './header/Header';
import Footer from './footer/Footer';

const LayoutPage = ({ children }) => {
    return (
        <div className="App" >
            <Header />
            <div className="container-fluid" >
                <div className="row">
                    <div className="col">
                        <main>{children}</main>
                    </div>
                </div>
            </div>
            <Footer className="footer"/>
        </div>
    );
}


export default LayoutPage;
