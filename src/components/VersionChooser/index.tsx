import makeClassName from 'classnames';
import queryString from 'query-string';
import * as React from 'react';
import { Button, Form } from 'react-bootstrap';
import { connect } from 'react-redux';
import { withRouter, RouteComponentProps } from 'react-router-dom';

import { ApplicationState } from '../../reducers';
import { ConnectedReduxProps } from '../../configureStore';
import PopoverButton from '../PopoverButton';
import VersionSelect from '../VersionSelect';
import {
  actions as popoverActions,
  PopoverIdType,
} from '../../reducers/popover';
import {
  actions as versionsActions,
  VersionsListItem,
  VersionsMap,
  VersionsState,
  fetchVersionsList,
} from '../../reducers/versions';
import { gettext } from '../../utils';
import styles from './styles.module.scss';

export const POPOVER_ID: PopoverIdType = 'COMPARE_VERSIONS';

export const higherVersionsThan = (versionId: string) => {
  return (version: VersionsListItem) => version.id > parseInt(versionId, 10);
};

export const lowerVersionsThan = (versionId: string) => {
  return (version: VersionsListItem) => version.id < parseInt(versionId, 10);
};

export type PublicProps = {
  addonId: number;
};

export type DefaultProps = {
  _fetchVersionsList: typeof fetchVersionsList;
  _higherVersionsThan: typeof higherVersionsThan;
  _lowerVersionsThan: typeof lowerVersionsThan;
};

type PropsFromState = {
  currentBaseVersionId: number | undefined | false;
  currentVersionId: number | undefined | false;
  pendingBaseVersionId: number | undefined;
  pendingHeadVersionId: number | undefined;
  versionsMap: VersionsMap;
  versions: VersionsState;
  selectedPath: string | null;
};

type RouterProps = RouteComponentProps<{}>;

type Props = PublicProps &
  ConnectedReduxProps &
  DefaultProps &
  PropsFromState &
  RouterProps;

export class VersionChooserBase extends React.Component<Props> {
  static defaultProps: DefaultProps = {
    _fetchVersionsList: fetchVersionsList,
    _higherVersionsThan: higherVersionsThan,
    _lowerVersionsThan: lowerVersionsThan,
  };

  componentDidMount() {
    const { _fetchVersionsList, addonId, dispatch, versionsMap } = this.props;

    if (!versionsMap) {
      dispatch(_fetchVersionsList({ addonId }));
    }

    this.synchronize();
  }

  componentDidUpdate() {
    this.synchronize();
  }

  synchronize() {
    const {
      currentBaseVersionId,
      currentVersionId,
      dispatch,
      pendingBaseVersionId,
      pendingHeadVersionId,
      versionsMap,
    } = this.props;

    if (pendingBaseVersionId === undefined && currentBaseVersionId) {
      dispatch(
        versionsActions.setPendingBaseVersionId({
          versionId: currentBaseVersionId,
        }),
      );
      return;
    }

    if (pendingHeadVersionId === undefined && currentVersionId) {
      dispatch(
        versionsActions.setPendingHeadVersionId({
          versionId: currentVersionId,
        }),
      );
      return;
    }

    if (pendingBaseVersionId) {
      return;
    }

    const allBaseVersions = versionsMap
      ? versionsMap.listed.concat(versionsMap.unlisted)
      : [];

    if (allBaseVersions.length) {
      // When nothing in the base version dropdown is selected,
      // choose the last item in the dropdown, the lowest base version.
      dispatch(
        versionsActions.setPendingBaseVersionId({
          versionId: allBaseVersions[allBaseVersions.length - 1].id,
        }),
      );
    }
  }

  onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const {
      addonId,
      dispatch,
      history,
      pendingBaseVersionId,
      pendingHeadVersionId,
      selectedPath,
    } = this.props;

    const query = selectedPath
      ? `?${queryString.stringify({ path: selectedPath })}`
      : '';

    dispatch(popoverActions.hide(POPOVER_ID));

    const lang = process.env.REACT_APP_DEFAULT_API_LANG;
    history.push(
      `/${lang}/compare/${addonId}/versions/${pendingBaseVersionId}...${pendingHeadVersionId}/${query}`,
    );
  };

  onHeadVersionChange = (versionId: number) => {
    const { dispatch } = this.props;
    dispatch(versionsActions.setPendingHeadVersionId({ versionId }));
  };

  onBaseVersionChange = (versionId: number) => {
    const { dispatch } = this.props;
    dispatch(versionsActions.setPendingBaseVersionId({ versionId }));
  };

  renderBrowseButton(versionId: string) {
    const { addonId, dispatch, history } = this.props;
    const lang = process.env.REACT_APP_DEFAULT_API_LANG;
    const href = versionId
      ? `/${lang}/browse/${addonId}/versions/${versionId}/`
      : undefined;

    return (
      <Button
        disabled={!versionId}
        onClick={(event: React.FormEvent<HTMLButtonElement>) => {
          event.preventDefault();
          event.stopPropagation();
          dispatch(popoverActions.hide(POPOVER_ID));
          if (href) {
            history.push(href);
          }
        }}
        href={href}
      >
        {gettext('Browse')}
      </Button>
    );
  }

  render() {
    const {
      _higherVersionsThan,
      _lowerVersionsThan,
      pendingBaseVersionId,
      pendingHeadVersionId,
      versionsMap,
    } = this.props;
    const headVersionId = String(pendingHeadVersionId || '');
    const baseVersionId = String(pendingBaseVersionId || '');

    const listedVersions = versionsMap ? versionsMap.listed : [];
    const unlistedVersions = versionsMap ? versionsMap.unlisted : [];

    const isLoading = !versionsMap;

    return (
      <PopoverButton
        id={POPOVER_ID}
        content={
          <Form className={styles.VersionChooser} onSubmit={this.onSubmit}>
            <div className={styles.formRow}>
              <VersionSelect
                className={makeClassName(
                  styles.versionSelect,
                  styles.baseVersionSelect,
                )}
                controlId="VersionSelect-oldVersion"
                formControlClassName={styles.versionSelectControl}
                isLoading={isLoading}
                isSelectable={_lowerVersionsThan(headVersionId)}
                label={gettext('Old version')}
                listedVersions={listedVersions}
                onChange={this.onBaseVersionChange}
                unlistedVersions={unlistedVersions}
                value={baseVersionId}
              />
              {this.renderBrowseButton(baseVersionId)}
            </div>

            <div className={styles.formRow}>
              <VersionSelect
                className={makeClassName(
                  styles.versionSelect,
                  styles.headVersionSelect,
                )}
                controlId="VersionSelect-newVersion"
                formControlClassName={styles.versionSelectControl}
                isLoading={isLoading}
                isSelectable={_higherVersionsThan(baseVersionId)}
                label={gettext('New version')}
                listedVersions={listedVersions}
                onChange={this.onHeadVersionChange}
                unlistedVersions={unlistedVersions}
                value={headVersionId}
              />
              {this.renderBrowseButton(headVersionId)}
            </div>

            <Button
              className={styles.submitButton}
              disabled={baseVersionId === headVersionId}
              type="submit"
              variant="primary"
            >
              {gettext('Compare')}
            </Button>
          </Form>
        }
        popoverClassName={styles.popover}
        prompt={gettext('Compare Versions')}
      />
    );
  }
}

const mapStateToProps = (
  state: ApplicationState,
  ownProps: PublicProps,
): PropsFromState => {
  const { byAddonId, selectedPath } = state.versions;
  const { addonId } = ownProps;

  return {
    currentBaseVersionId: state.versions.currentBaseVersionId,
    currentVersionId: state.versions.currentVersionId,
    pendingBaseVersionId: state.versions.pendingBaseVersionId,
    pendingHeadVersionId: state.versions.pendingHeadVersionId,
    selectedPath,
    versions: state.versions,
    versionsMap: byAddonId[addonId],
  };
};

const ConnectedVersionChooser = connect(mapStateToProps)(VersionChooserBase);

// We have to export this class to tell Storybook that it's okay to inject the
// router props directly. That's because we want to by-pass the `withRouter()`
// HOC, which requires a `Router` and a `Route` and we don't want that in
// Storybook.
export const VersionChooserWithoutRouter = ConnectedVersionChooser as React.ComponentType<
  PublicProps & Partial<DefaultProps & RouterProps>
>;

export default withRouter<PublicProps & Partial<DefaultProps> & RouterProps>(
  ConnectedVersionChooser,
);
