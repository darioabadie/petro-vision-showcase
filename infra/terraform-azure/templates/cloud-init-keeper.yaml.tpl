#cloud-config
package_update: true
packages:
  - docker.io

write_files:
  - path: /etc/pvm-keeper/keeper_config.xml
    permissions: "0644"
    content: |
      <clickhouse>
        <listen_host>0.0.0.0</listen_host>
        <keeper_server>
          <tcp_port>${keeper_client_port}</tcp_port>
          <server_id>1</server_id>
          <log_storage_path>/var/lib/clickhouse-keeper/coordination/log</log_storage_path>
          <snapshot_storage_path>/var/lib/clickhouse-keeper/coordination/snapshots</snapshot_storage_path>
          <coordination_settings>
            <operation_timeout_ms>10000</operation_timeout_ms>
            <session_timeout_ms>30000</session_timeout_ms>
            <raft_logs_level>information</raft_logs_level>
          </coordination_settings>
          <raft_configuration>
            <server>
              <id>1</id>
              <hostname>${keeper_ip}</hostname>
              <port>${keeper_raft_port}</port>
            </server>
          </raft_configuration>
        </keeper_server>
      </clickhouse>

  - path: /etc/systemd/system/pvm-keeper.service
    permissions: "0644"
    content: |
      [Unit]
      Description=PVM ClickHouse Keeper (coordination node)
      After=docker.service network-online.target
      Requires=docker.service
      Wants=network-online.target

      [Service]
      Restart=always
      RestartSec=5
      ExecStartPre=-/usr/bin/docker rm -f pvm-keeper
      ExecStart=/usr/bin/docker run --rm --name pvm-keeper \
        --network host \
        -e CLICKHOUSE_DATA_DIR=/var/lib/clickhouse-keeper \
        -v /etc/pvm-keeper/keeper_config.xml:/etc/clickhouse-keeper/keeper_config.xml:ro \
        -v /var/lib/pvm-keeper:/var/lib/clickhouse-keeper \
        ${clickhouse_keeper_image}
      ExecStop=/usr/bin/docker stop pvm-keeper

      [Install]
      WantedBy=multi-user.target

runcmd:
  - mkdir -p /var/lib/pvm-keeper
  - systemctl enable docker
  - systemctl start docker
  - systemctl daemon-reload
  - systemctl enable pvm-keeper
  - systemctl start pvm-keeper
