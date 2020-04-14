import React, { useEffect, useReducer, useContext } from 'react';
import { TextField, Breadcrumbs, Link, Typography } from '@material-ui/core';

import { CarverUserContext } from '../contexts/CarverUser';

const CustomBreadcrumbs: React.FC = () => {
    const { state: carverUserState, dispatch: carverUserDispatch } = useContext(CarverUserContext)

    if (!carverUserState.page) {
        return null;
    }

    const { breadcrumbs } = carverUserState.page;
    if (!breadcrumbs) {
        return null;
    }

    const breadcrumbsElements = breadcrumbs.map((breadcrumb, index) => {
        if (index === breadcrumbs.length - 1) {
            return <Typography color="textPrimary">{breadcrumb.title}</Typography>
        }
        return <Link color="inherit" href={breadcrumb.href}>
            {breadcrumb.title}
        </Link>
    });

    console.log('**breadcrumbs:', breadcrumbs);

    return <Breadcrumbs aria-label="breadcrumb">
        {breadcrumbsElements}
    </Breadcrumbs>
}
export default CustomBreadcrumbs;