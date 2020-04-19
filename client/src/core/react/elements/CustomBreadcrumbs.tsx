import React, { useEffect, useReducer, useContext, MouseEvent } from 'react';
import { TextField, Breadcrumbs, Link, Typography } from '@material-ui/core';

import { CarverUserContext } from '../contexts/CarverUser';
import { SocketContext } from '../../../core/react/contexts/Socket'
import { commonLanguage as carverUserCommonLanguage } from '../../../core/carver/contexts/publicState/context'

const CustomBreadcrumbs: React.FC = React.memo(() => {
    const { state: carverUserState, dispatch: carverUserDispatch } = useContext(CarverUserContext)
    const { socket } = useContext(SocketContext)

    if (!carverUserState.page) {
        return null;
    }

    const { breadcrumbs } = carverUserState.page;
    if (!breadcrumbs) {
        return null;
    }

    const breadcrumbsElements = breadcrumbs.map((breadcrumb, index) => {
        const { pathname } = breadcrumb

        const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
            if (!pathname) {
                return;
            }
            socket.command({
                type: carverUserCommonLanguage.commands.Pages.NavigateByPathname,
                payload: {
                    pathname,
                    pushHistory: false // When PAGE_NAVIGATED event is called don't add new page to browser history
                }
            });

            e.preventDefault(); // Do not follow href (href is on breadcrumbs so you can open them in new tab)
        }
        if (index === breadcrumbs.length - 1) {
            return <Typography color="textPrimary">{breadcrumb.title}</Typography>
        }
        return <Link color="inherit" href={pathname} onClick={onClick}>
            {breadcrumb.title}
        </Link>
    });

    return <Breadcrumbs aria-label="breadcrumb">
        {breadcrumbsElements}
    </Breadcrumbs>
})

export default CustomBreadcrumbs;