#cloud-config
package_update: true
packages:
  - docker.io

write_files:
  - path: /etc/pvm-ch/config.d/listen_host.xml
    permissions: "0644"
    content: |
      <clickhouse>
        <listen_host>0.0.0.0</listen_host>
      </clickhouse>

  - path: /etc/pvm-ch/config.d/macros.xml
    permissions: "0644"
    content: |
      <clickhouse>
        <macros>
          <shard>${shard}</shard>
          <replica>${replica}</replica>
        </macros>
      </clickhouse>

  - path: /etc/pvm-ch/config.d/remote_servers.xml
    permissions: "0644"
    content: |
      <clickhouse>
        <remote_servers>
          <pvm_cluster>
      %{ for shard_block in cluster_shards ~}
            <shard>
              <internal_replication>true</internal_replication>
      %{ for replica in shard_block.replicas ~}
              <replica>
                <host>${replica.host}</host>
                <port>${replica.port}</port>
              </replica>
      %{ endfor ~}
            </shard>
      %{ endfor ~}
          </pvm_cluster>
        </remote_servers>
      </clickhouse>

  - path: /etc/pvm-ch/config.d/zookeeper.xml
    permissions: "0644"
    content: |
      <clickhouse>
        <zookeeper>
          <node>
            <host>${keeper_ip}</host>
            <port>${keeper_client_port}</port>
          </node>
        </zookeeper>
      </clickhouse>

  - path: /etc/pvm-ch/config.d/interserver.xml
    permissions: "0644"
    content: |
      <clickhouse>
        <interserver_http_host>${private_ip}</interserver_http_host>
      </clickhouse>

  - path: /etc/systemd/system/pvm-clickhouse.service
    permissions: "0644"
    content: |
      [Unit]
      Description=PVM ClickHouse cluster node (shard ${shard}, replica ${replica})
      After=docker.service network-online.target
      Requires=docker.service
      Wants=network-online.target

      [Service]
      Restart=always
      RestartSec=5
      ExecStartPre=-/usr/bin/docker rm -f pvm-clickhouse
      ExecStart=/usr/bin/docker run --rm --name pvm-clickhouse \
        --network host \
        --ulimit nofile=262144:262144 \
        -e CLICKHOUSE_SKIP_USER_SETUP=1 \
        -v /etc/pvm-ch/config.d:/etc/clickhouse-server/config.d:ro \
        -v /var/lib/pvm-clickhouse:/var/lib/clickhouse \
        ${clickhouse_image}
      ExecStop=/usr/bin/docker stop pvm-clickhouse

      [Install]
      WantedBy=multi-user.target

runcmd:
  - mkdir -p /var/lib/pvm-clickhouse
  - systemctl enable docker
  - systemctl start docker
  - systemctl daemon-reload
  - systemctl enable pvm-clickhouse
  - systemctl start pvm-clickhouse
