import React from 'react'
import { StationLogin } from '@/components/stationLogin'
import { Box } from 'lucide-react'

const order = () => {

    return (
        <StationLogin
            stationName="Orden"
            stationIcon={<Box size={24} />}
            stationColor="bg-primary"
            targetRole="admin"
        >
            <h1>Order</h1>
        </StationLogin>
    )
}

export default order