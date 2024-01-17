
import React from "react";
import { Feed, Loader } from "semantic-ui-react";
import format from "lib/format";
import useLatest from "hooks/useLatest";
import { NodeLink, NodeImage } from "components/nodeparts";
import theme from "../theme.module.css";

const Latest = () => {
    const [ events, , loading ] = useLatest();

    return (
        <Feed>
            <If condition={loading}>
                <div className={theme.loader}>
                    <Loader active>Loading...</Loader>
                </div>
            </If>
            <For each="event" of={events}>
                <Feed.Event key={event.node._id}>
                    <Feed.Label>
                        <NodeImage
                            path={`${event.userpath}/person/profilePicture`}
                            avatar
                            format={{
                                width: 50,
                                height: 50,
                                type: "image"
                            }}
                            noFixedSize
                        />
                    </Feed.Label>
                    <Feed.Content>
                        <Feed.Date>{format.datetimeAgo(event.time)}</Feed.Date>
                        <Feed.Summary>
                            {event.username} added <NodeLink node={event.node} icon />
                        </Feed.Summary>
                        <If condition={event.files.length > 0}>
                            <Feed.Extra images>
                                <For each="file" of={event.files}>
                                    <NodeImage
                                        key={file._id}
                                        path={file.path}
                                        format={{
                                            width: 216,
                                            height: 216,
                                            type: "image"
                                        }}
                                        noFixedSize
                                    />
                                </For>
                            </Feed.Extra>
                        </If>
                        <br />
                    </Feed.Content>
                </Feed.Event>
            </For>
        </Feed>
    );
};

export default Latest;
