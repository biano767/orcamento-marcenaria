import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-gray-400 py-6 mt-auto">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm mb-2">© {new Date().getFullYear()} OrçaMDF Lite. Todos os direitos reservados.</p>
        <p className="text-xs text-gray-500">
          Este sistema utiliza IA para gerar estimativas. Sempre confira os valores reais com fornecedores.
          Os dados são apagados ao fechar o navegador.
        </p>
      </div>
    </footer>
  );
};

export default Footer;