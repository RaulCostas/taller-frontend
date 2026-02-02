import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const OrdenesTrabajo = () => {
    const navigate = useNavigate();

    useEffect(() => {
        navigate('/ordenes-trabajo/list');
    }, [navigate]);

    return null;
};

export default OrdenesTrabajo;

